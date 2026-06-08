import * as fs from 'fs';
import * as path from 'path';
import { UuidResetter } from './resetter';
import { ResetPreview, ResetResult } from './types';

/**
 * Cocos Creator 編輯器擴展主進程
 */

/** 暫存：待重置的資料夾 URL */
let _pendingResetFolder: string = '';
let _resetVersion: number = 0;

export function load() {
    console.log('[UuidResetter] 插件已載入');
}

export function unload() {
    console.log('[UuidResetter] 插件已卸載');
}

export const methods = {
    openPanel() {
        Editor.Panel.open('uuid-resetter.default');
    },

    /**
     * 右鍵資源管理器觸發
     */
    resetFolderByUrl(folderUrl: string) {
        if (!folderUrl) return;
        console.log(`[UuidResetter] 準備重置資料夾: ${folderUrl}`);
        _pendingResetFolder = folderUrl;
        _resetVersion++;
        Editor.Panel.open('uuid-resetter.default');
    },

    /**
     * 面板輪詢取得待重置資料夾
     */
    getPendingResetFolder() {
        return {
            folder: _pendingResetFolder,
            version: _resetVersion,
        };
    },

    /**
     * 取得重置預覽資訊
     */
    getResetPreview(folderUrl: string): ResetPreview | null {
        try {
            const projectPath = Editor.Project.path;
            const absolutePath = resolveDbUrl(folderUrl, projectPath);
            if (!absolutePath) return null;

            const resetter = new UuidResetter(projectPath, absolutePath);
            return resetter.getPreview();
        } catch (error) {
            console.error('[UuidResetter] 預覽失敗:', error);
            return null;
        }
    },

    /**
     * 執行 UUID 重置
     */
    async executeReset(folderUrl: string): Promise<ResetResult & { mappingFilePath?: string }> {
        try {
            const projectPath = Editor.Project.path;
            const absolutePath = resolveDbUrl(folderUrl, projectPath);
            if (!absolutePath) {
                return {
                    success: false,
                    uuidResetCount: 0,
                    referenceUpdateCount: 0,
                    modifiedFileCount: 0,
                    duration: 0,
                    mappings: [],
                    errors: [{ file: '', error: '無法解析資料夾路徑' }],
                };
            }

            console.log(`[UuidResetter] 開始重置: ${folderUrl}`);

            const resetter = new UuidResetter(projectPath, absolutePath);

            // 執行重置
            const result = resetter.execute();

            // 匯出映射表到資料夾下
            let mappingFilePath: string | undefined;
            if (result.mappings.length > 0) {
                const mappingJson = resetter.exportMappings(result.mappings);
                mappingFilePath = path.join(absolutePath, '_uuid-reset-mapping.json');
                fs.writeFileSync(mappingFilePath, mappingJson, 'utf-8');
                console.log(`[UuidResetter] 映射表已匯出: ${mappingFilePath}`);
            }

            console.log(
                `[UuidResetter] 重置完成: ` +
                `${result.uuidResetCount} UUID, ` +
                `${result.referenceUpdateCount} 引用更新, ` +
                `${result.modifiedFileCount} 檔案修改, ` +
                `耗時 ${result.duration}ms`
            );

            if (result.errors.length > 0) {
                console.warn(`[UuidResetter] ${result.errors.length} 個警告:`, result.errors);
            }

            return { ...result, mappingFilePath };
        } catch (error: any) {
            console.error('[UuidResetter] 重置失敗:', error);
            return {
                success: false,
                uuidResetCount: 0,
                referenceUpdateCount: 0,
                modifiedFileCount: 0,
                duration: 0,
                mappings: [],
                errors: [{ file: '', error: error.message || String(error) }],
            };
        }
    },
};

/**
 * 將 db:// URL 轉換為絕對路徑
 */
function resolveDbUrl(dbUrl: string, projectPath: string): string | null {
    if (dbUrl.startsWith('db://assets/')) {
        const relativePart = dbUrl.replace('db://assets/', '');
        return path.join(projectPath, 'assets', relativePart);
    } else if (dbUrl.startsWith('db://assets')) {
        return path.join(projectPath, 'assets');
    }
    return null;
}
