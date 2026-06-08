import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { UuidMapping, ScanResult, ResetResult, ResetPreview } from './types';
import { compressUuid } from './uuid-utils';

/**
 * UUID 重置器
 * 負責掃描資料夾內所有 UUID，產生新 UUID 映射，並替換所有引用
 */
export class UuidResetter {
    private projectPath: string;
    private targetFolder: string;

    constructor(projectPath: string, targetFolder: string) {
        this.projectPath = projectPath;
        this.targetFolder = targetFolder;
    }

    /**
     * 執行完整的 UUID 重置流程
     */
    execute(): ResetResult {
        const startTime = Date.now();
        const errors: Array<{ file: string; error: string }> = [];

        // Step 1: 掃描並建立映射
        const scanResult = this.scanAndBuildMappings();
        const mappings = scanResult.mappings;

        if (mappings.length === 0) {
            return {
                success: true,
                uuidResetCount: 0,
                referenceUpdateCount: 0,
                modifiedFileCount: 0,
                duration: Date.now() - startTime,
                mappings: [],
                errors: [],
            };
        }

        // 建立快速查找用的 Map（長 UUID 優先匹配，避免 subMeta UUID 被部分匹配）
        // 按長度降序排列，確保 "uuid@hash" 比 "uuid" 先被匹配
        const sortedMappings = [...mappings].sort((a, b) => b.oldUuid.length - a.oldUuid.length);

        // 同時建立壓縮格式的映射（用於 __type__ 欄位）
        const compressedMappings: Array<{ oldCompressed: string; newCompressed: string }> = [];
        for (const mapping of mappings) {
            const oldCompressed = compressUuid(mapping.oldUuid);
            const newCompressed = compressUuid(mapping.newUuid);
            // 只有壓縮後不等於原始值才加入（避免無效 UUID）
            if (oldCompressed !== mapping.oldUuid && oldCompressed.length >= 5) {
                compressedMappings.push({ oldCompressed, newCompressed });
            }
        }
        // 壓縮映射也按長度降序
        compressedMappings.sort((a, b) => b.oldCompressed.length - a.oldCompressed.length);

        // Step 2: 替換 .meta 檔案中的 UUID
        const metaFiles = this.findMetaFiles();
        let modifiedFiles = 0;
        let referenceUpdateCount = 0;

        for (const metaFile of metaFiles) {
            try {
                const original = fs.readFileSync(metaFile, 'utf-8');
                let modified = original;

                // 替換原始格式 UUID
                for (const mapping of sortedMappings) {
                    if (modified.includes(mapping.oldUuid)) {
                        modified = this.replaceAll(modified, mapping.oldUuid, mapping.newUuid);
                    }
                }

                if (modified !== original) {
                    fs.writeFileSync(metaFile, modified, 'utf-8');
                    modifiedFiles++;
                    referenceUpdateCount += this.countOccurrences(original, sortedMappings.map(m => m.oldUuid));
                }
            } catch (e: any) {
                errors.push({ file: path.relative(this.projectPath, metaFile), error: e.message });
            }
        }

        // Step 3: 替換引用檔案中的 UUID（.prefab, .scene, .anim, .material 等）
        const referenceFiles = this.findReferenceFiles();

        for (const refFile of referenceFiles) {
            try {
                const original = fs.readFileSync(refFile, 'utf-8');
                let modified = original;

                // 替換原始格式 UUID
                for (const mapping of sortedMappings) {
                    if (modified.includes(mapping.oldUuid)) {
                        modified = this.replaceAll(modified, mapping.oldUuid, mapping.newUuid);
                    }
                }

                // 替換壓縮格式 UUID（__type__ 欄位等）
                for (const cm of compressedMappings) {
                    if (modified.includes(cm.oldCompressed)) {
                        modified = this.replaceAll(modified, cm.oldCompressed, cm.newCompressed);
                    }
                }

                if (modified !== original) {
                    fs.writeFileSync(refFile, modified, 'utf-8');
                    modifiedFiles++;
                    referenceUpdateCount += this.countOccurrences(original, [
                        ...sortedMappings.map(m => m.oldUuid),
                        ...compressedMappings.map(cm => cm.oldCompressed),
                    ]);
                }
            } catch (e: any) {
                errors.push({ file: path.relative(this.projectPath, refFile), error: e.message });
            }
        }

        // Step 4: 驗證（檢查是否還有殘留的舊 UUID）
        const verificationErrors = this.verify(sortedMappings);
        errors.push(...verificationErrors);

        const duration = Date.now() - startTime;

        return {
            success: errors.length === 0,
            uuidResetCount: mappings.length,
            referenceUpdateCount,
            modifiedFileCount: modifiedFiles,
            duration,
            mappings,
            errors,
        };
    }

    /**
     * 掃描資料夾內所有 UUID，建立映射表
     */
    scanAndBuildMappings(): ScanResult {
        const mappings: UuidMapping[] = [];
        const metaFiles = this.findMetaFiles();

        // 解析每個 .meta 檔案，收集 UUID
        for (const metaFile of metaFiles) {
            try {
                const content = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
                this.collectUuidsFromMeta(content, metaFile, mappings);
            } catch (e) {
                console.warn(`[UuidResetter] 無法解析 meta: ${metaFile}`, e);
            }
        }

        // 統計引用檔案
        const referenceFiles = this.findReferenceFiles();

        return {
            folderPath: path.relative(this.projectPath, this.targetFolder),
            mappings,
            mainUuidCount: mappings.filter(m => !m.isSubMeta).length,
            subMetaUuidCount: mappings.filter(m => m.isSubMeta).length,
            metaFileCount: metaFiles.length,
            referenceFileCount: referenceFiles.length,
        };
    }

    /**
     * 產生重置預覽資訊
     */
    getPreview(): ResetPreview {
        const scanResult = this.scanAndBuildMappings();
        const fileTypes: Record<string, number> = {};

        this.walkDirectory(this.targetFolder, (filePath) => {
            if (filePath.endsWith('.meta')) return;
            const ext = path.extname(filePath).toLowerCase();
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        });

        return {
            folderPath: scanResult.folderPath,
            uuidCount: scanResult.mappings.length,
            fileCount: scanResult.metaFileCount + scanResult.referenceFileCount,
            fileTypes,
        };
    }

    /**
     * 匯出映射表為 JSON
     */
    exportMappings(mappings: UuidMapping[]): string {
        const exportData = {
            timestamp: new Date().toISOString(),
            folder: path.relative(this.projectPath, this.targetFolder),
            totalMappings: mappings.length,
            mappings: mappings.map(m => ({
                old: m.oldUuid,
                new: m.newUuid,
                file: m.sourceFile,
                isSubMeta: m.isSubMeta,
            })),
        };
        return JSON.stringify(exportData, null, 2);
    }

    // ─── Private Methods ──────────────────────────────────────────────

    /**
     * 從 meta 內容中收集所有 UUID，並產生新的 UUID 映射
     */
    private collectUuidsFromMeta(metaContent: any, metaFile: string, mappings: UuidMapping[]): void {
        // 收集主 UUID
        if (metaContent.uuid && typeof metaContent.uuid === 'string') {
            const oldUuid = metaContent.uuid;
            // 避免重複收集（同一 UUID 只映射一次）
            if (!mappings.find(m => m.oldUuid === oldUuid)) {
                const newUuid = this.generateUuid();
                mappings.push({
                    oldUuid,
                    newUuid,
                    sourceFile: path.relative(this.projectPath, metaFile),
                    isSubMeta: false,
                });
            }
        }

        // 收集 subMetas 中的 UUID
        if (metaContent.subMetas && typeof metaContent.subMetas === 'object') {
            for (const [subKey, subMeta] of Object.entries(metaContent.subMetas)) {
                const sub = subMeta as any;
                if (sub.uuid && typeof sub.uuid === 'string') {
                    const oldSubUuid = sub.uuid;

                    // 避免重複
                    if (mappings.find(m => m.oldUuid === oldSubUuid)) continue;

                    const atIndex = oldSubUuid.indexOf('@');
                    if (atIndex !== -1) {
                        const mainPart = oldSubUuid.substring(0, atIndex);
                        const hash = oldSubUuid.substring(atIndex); // 包含 @

                        // 找到對應的 main UUID 映射
                        const mainMapping = mappings.find(m => !m.isSubMeta && m.oldUuid === mainPart);
                        if (mainMapping) {
                            mappings.push({
                                oldUuid: oldSubUuid,
                                newUuid: mainMapping.newUuid + hash,
                                sourceFile: path.relative(this.projectPath, metaFile),
                                isSubMeta: true,
                            });
                        } else {
                            // main UUID 不在映射中（可能是外部引用），產生獨立新 UUID
                            const newMainUuid = this.generateUuid();
                            mappings.push({
                                oldUuid: oldSubUuid,
                                newUuid: newMainUuid + hash,
                                sourceFile: path.relative(this.projectPath, metaFile),
                                isSubMeta: true,
                            });
                        }
                    } else {
                        // subMeta 沒有 @ 後綴
                        const newUuid = this.generateUuid();
                        mappings.push({
                            oldUuid: oldSubUuid,
                            newUuid,
                            sourceFile: path.relative(this.projectPath, metaFile),
                            isSubMeta: true,
                        });
                    }
                }

                // 遞迴處理巢狀 subMetas
                if (sub.subMetas && typeof sub.subMetas === 'object') {
                    this.collectUuidsFromMeta(sub, metaFile, mappings);
                }
            }
        }
    }

    /**
     * 驗證：掃描所有檔案確認舊 UUID 已被完全替換
     */
    private verify(sortedMappings: UuidMapping[]): Array<{ file: string; error: string }> {
        const errors: Array<{ file: string; error: string }> = [];
        const allFiles = [...this.findMetaFiles(), ...this.findReferenceFiles()];

        for (const filePath of allFiles) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                for (const mapping of sortedMappings) {
                    if (content.includes(mapping.oldUuid)) {
                        errors.push({
                            file: path.relative(this.projectPath, filePath),
                            error: `仍包含舊 UUID: ${mapping.oldUuid}`,
                        });
                        break; // 每個檔案只報一次
                    }
                }
            } catch (e) {
                // 讀取失敗忽略
            }
        }

        return errors;
    }

    /**
     * 找出所有 .meta 檔案
     */
    private findMetaFiles(): string[] {
        const files: string[] = [];
        this.walkDirectory(this.targetFolder, (filePath) => {
            if (filePath.endsWith('.meta')) {
                files.push(filePath);
            }
        });
        return files;
    }

    /**
     * 找出資料夾內所有可能包含 UUID 引用的檔案
     */
    private findReferenceFiles(): string[] {
        const referenceExtensions = [
            '.prefab', '.scene', '.anim', '.animation',
            '.material', '.mtl', '.effect',
            '.fnt', '.pac',
            '.json',
        ];

        const files: string[] = [];
        this.walkDirectory(this.targetFolder, (filePath) => {
            const ext = path.extname(filePath).toLowerCase();
            // .json 但非 .meta
            if (referenceExtensions.includes(ext) && !filePath.endsWith('.meta')) {
                files.push(filePath);
            }
        });

        return files;
    }

    /**
     * 全域替換字串（不使用 regex 避免特殊字元問題）
     */
    private replaceAll(str: string, search: string, replace: string): string {
        let result = str;
        let index = result.indexOf(search);
        while (index !== -1) {
            result = result.substring(0, index) + replace + result.substring(index + search.length);
            index = result.indexOf(search, index + replace.length);
        }
        return result;
    }

    /**
     * 計算字串中包含多少個目標子字串
     */
    private countOccurrences(str: string, targets: string[]): number {
        let count = 0;
        for (const target of targets) {
            let idx = str.indexOf(target);
            while (idx !== -1) {
                count++;
                idx = str.indexOf(target, idx + target.length);
            }
        }
        return count;
    }

    /**
     * 產生 Cocos Creator 相容的 UUID (v4 格式)
     */
    private generateUuid(): string {
        const bytes = crypto.randomBytes(16);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = bytes.toString('hex');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }

    /**
     * 遞迴遍歷目錄
     */
    private walkDirectory(dirPath: string, callback: (filePath: string) => void): void {
        if (!fs.existsSync(dirPath)) return;

        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue; // 忽略隱藏檔案
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                this.walkDirectory(fullPath, callback);
            } else if (entry.isFile()) {
                callback(fullPath);
            }
        }
    }
}
