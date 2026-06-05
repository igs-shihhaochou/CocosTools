import * as fs from 'fs';
import * as path from 'path';
import {
    ImageScanResult,
    AtlasInfo,
    ScanOptions,
    ScanReport,
    CompressionCategory,
    ImageFormat,
} from './types';

/** 預設掃描選項 */
const DEFAULT_SCAN_OPTIONS: ScanOptions = {
    minFileSize: 0,
    largeFileThreshold: 100 * 1024, // 100KB
    imageExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.bmp'],
    excludePatterns: [],
    scanSubPath: undefined,
};

/**
 * 圖片壓縮掃描器
 * 負責掃描專案中所有圖片資源，判斷壓縮狀態與圖集歸屬
 */
export class ImageCompressionScanner {
    private projectPath: string;
    private assetsPath: string;
    private options: ScanOptions;
    /** 專案中有效的 preset ID 列表（內建 + 使用者自定義） */
    private validPresetIds: string[];

    constructor(projectPath: string, options?: Partial<ScanOptions>) {
        this.projectPath = projectPath;
        this.assetsPath = path.join(projectPath, 'assets');
        this.options = { ...DEFAULT_SCAN_OPTIONS, ...options };
        this.validPresetIds = this.loadValidPresetIds();
    }

    /**
     * 從專案設定中讀取有效的壓縮 Preset ID 列表
     * 來源：settings/v2/packages/builder.json → textureCompressConfig.userPreset
     * 加上 Cocos 內建的 preset: "default" (Default Opaque), "transparent" (Default Transparent)
     */
    private loadValidPresetIds(): string[] {
        // Cocos Creator 內建 preset ID
        const builtinPresets = ['default', 'transparent'];

        // 讀取使用者自定義 preset
        const builderJsonPath = path.join(this.projectPath, 'settings', 'v2', 'packages', 'builder.json');
        try {
            if (fs.existsSync(builderJsonPath)) {
                const content = JSON.parse(fs.readFileSync(builderJsonPath, 'utf-8'));
                const userPreset = content?.textureCompressConfig?.userPreset;
                if (userPreset && typeof userPreset === 'object') {
                    const userIds = Object.keys(userPreset);
                    return [...builtinPresets, ...userIds];
                }
            }
        } catch (e) {
            console.warn('[ImageCompressionChecker] 無法讀取 builder.json:', e);
        }

        return builtinPresets;
    }

    /**
     * 執行完整掃描
     */
    async scan(): Promise<ScanReport> {
        const startTime = Date.now();

        // Step 1: 掃描所有圖集
        const atlases = this.scanAtlases();

        // Step 2: 掃描所有圖片
        const imageFiles = this.findAllImages();

        // Step 3: 對每張圖片進行分析（只收集散圖，已入圖集的不列出）
        const allResults: ImageScanResult[] = [];
        for (const imagePath of imageFiles) {
            const result = this.analyzeImage(imagePath, atlases);
            if (result) {
                // 已入圖集的散圖不列出（圖集會單獨列一行）
                if (result.atlasNames.length > 0) {
                    continue;
                }
                // 檢查是否為 bmFont 關聯圖片（同目錄下有同名 .fnt 檔案）
                if (this.isBmFontImage(imagePath)) {
                    result.category = CompressionCategory.ATLAS_COMPRESSED; // 標記為不需處理
                    result.suggestion = '🔤 字型圖片（bmFont），不需壓縮';
                    // 仍加入結果但會被預設篩選排除
                    allResults.push(result);
                    continue;
                }
                allResults.push(result);
            }
        }

        // Step 3.5: 把未壓縮的圖集本身作為一行加入結果
        for (const atlas of atlases) {
            if (!atlas.hasCompression) {
                // 計算圖集包含的圖片數量和總大小
                const atlasDir = atlas.coveragePath;
                let atlasImageCount = 0;
                let atlasTotalSize = 0;
                for (const imgPath of imageFiles) {
                    const imgDir = path.dirname(imgPath);
                    if (imgDir.startsWith(atlasDir) || imgDir === atlasDir) {
                        atlasImageCount++;
                        try {
                            const stat = fs.statSync(imgPath);
                            atlasTotalSize += stat.size;
                        } catch (e) {}
                    }
                }

                allResults.push({
                    relativePath: atlas.path,
                    absolutePath: path.join(this.projectPath, atlas.path),
                    fileSize: atlasTotalSize,
                    width: 0,
                    height: 0,
                    format: 'pac' as any,
                    hasCompression: false,
                    compressionPlatforms: [],
                    compressionFormats: [],
                    category: CompressionCategory.ATLAS_UNCOMPRESSED,
                    atlasNames: [atlas.path],
                    atlasCompressed: false,
                    estimatedCompressedSize: Math.floor(atlasTotalSize * 0.3),
                    estimatedSaving: Math.floor(atlasTotalSize * 0.7),
                    suggestion: `⚠️ 圖集未壓縮（包含 ${atlasImageCount} 張圖片），請設定有效的 Preset Id`,
                });
            }
        }

        // Step 4: 按大小降序排列
        allResults.sort((a, b) => b.fileSize - a.fileSize);

        // Step 5: 分類
        const categories = {
            looseUncompressed: allResults.filter(r => r.category === CompressionCategory.LOOSE_UNCOMPRESSED),
            atlasUncompressed: allResults.filter(r => r.category === CompressionCategory.ATLAS_UNCOMPRESSED),
            atlasInvalidPreset: allResults.filter(r => r.category === CompressionCategory.ATLAS_INVALID_PRESET),
            looseCompressed: allResults.filter(r => r.category === CompressionCategory.LOOSE_COMPRESSED),
            atlasCompressed: allResults.filter(r => r.category === CompressionCategory.ATLAS_COMPRESSED),
        };

        // Step 6: 統計摘要
        const totalSize = allResults.reduce((sum, r) => sum + r.fileSize, 0);
        const totalEstimatedSaving = allResults.reduce((sum, r) => sum + r.estimatedSaving, 0);

        const summary = {
            totalImages: allResults.length,
            totalSize,
            totalSizeFormatted: this.formatFileSize(totalSize),

            looseUncompressedCount: categories.looseUncompressed.length,
            looseUncompressedSize: categories.looseUncompressed.reduce((sum, r) => sum + r.fileSize, 0),

            atlasUncompressedCount: categories.atlasUncompressed.length,
            atlasUncompressedSize: categories.atlasUncompressed.reduce((sum, r) => sum + r.fileSize, 0),

            looseCompressedCount: categories.looseCompressed.length,
            looseCompressedSize: categories.looseCompressed.reduce((sum, r) => sum + r.fileSize, 0),

            atlasCompressedCount: categories.atlasCompressed.length,
            atlasCompressedSize: categories.atlasCompressed.reduce((sum, r) => sum + r.fileSize, 0),

            notInAtlasCount: allResults.filter(r => r.atlasNames.length === 0).length,

            totalEstimatedSaving,
            totalEstimatedSavingFormatted: this.formatFileSize(totalEstimatedSaving),
        };

        const duration = Date.now() - startTime;

        return {
            scanTime: new Date().toISOString(),
            duration,
            projectPath: this.projectPath,
            summary,
            atlases,
            categories,
            allResults,
        };
    }

    /**
     * 掃描專案中所有圖集（Auto Atlas + SpriteAtlas）
     */
    private scanAtlases(): AtlasInfo[] {
        const atlases: AtlasInfo[] = [];

        // 遞迴搜尋 assets 資料夾
        this.walkDirectory(this.assetsPath, (filePath) => {
            const ext = path.extname(filePath).toLowerCase();
            const basename = path.basename(filePath);

            // Auto Atlas: .pac 檔案
            if (ext === '.pac') {
                const atlasInfo = this.parseAutoAtlas(filePath);
                if (atlasInfo) {
                    atlases.push(atlasInfo);
                }
            }

            // SpriteAtlas: 通常是 .json 檔案，但需要檢查 meta 的 importer
            // 在 Cocos Creator 3.x 中，SpriteAtlas 的 meta 檔案 importer 為 'sprite-atlas'
            if (ext === '.meta') {
                return; // meta 檔案在其他流程中處理
            }
        });

        return atlases;
    }

    /**
     * 解析 Auto Atlas (.pac) 檔案
     */
    private parseAutoAtlas(pacFilePath: string): AtlasInfo | null {
        const metaPath = pacFilePath + '.meta';
        if (!fs.existsSync(metaPath)) {
            return null;
        }

        try {
            const metaContent = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            const compressionStatus = this.checkMetaCompressionStatus(metaContent);
            const hasCompression = compressionStatus === 'valid';
            const hasInvalidPreset = compressionStatus === 'invalid_preset';
            const { platforms, formats } = this.getCompressionDetails(metaContent);

            // Auto Atlas 涵蓋的是 .pac 檔案所在的資料夾
            const coveragePath = path.dirname(pacFilePath);

            return {
                path: path.relative(this.projectPath, pacFilePath),
                type: 'auto-atlas',
                hasCompression,
                hasInvalidPreset,
                compressionPlatforms: platforms,
                compressionFormats: formats,
                coveragePath,
            };
        } catch (e) {
            console.warn(`[ImageCompressionChecker] 無法解析 Auto Atlas meta: ${metaPath}`, e);
            return null;
        }
    }

    /**
     * 尋找所有圖片檔案
     */
    private findAllImages(): string[] {
        const images: string[] = [];

        // 使用指定的子資料夾或整個 assets
        const scanRoot = this.options.scanSubPath || this.assetsPath;

        if (!fs.existsSync(scanRoot)) {
            return images;
        }

        this.walkDirectory(scanRoot, (filePath) => {
            const ext = path.extname(filePath).toLowerCase();
            if (this.options.imageExtensions.includes(ext)) {
                // 檢查排除 pattern
                const relativePath = path.relative(this.projectPath, filePath);
                const excluded = this.options.excludePatterns.some(pattern =>
                    relativePath.includes(pattern)
                );
                if (!excluded) {
                    images.push(filePath);
                }
            }
        });

        return images;
    }

    /**
     * 分析單張圖片
     */
    private analyzeImage(imagePath: string, atlases: AtlasInfo[]): ImageScanResult | null {
        try {
            const stat = fs.statSync(imagePath);
            const fileSize = stat.size;

            // 小於最小檔案大小則跳過
            if (fileSize < this.options.minFileSize) {
                return null;
            }

            const relativePath = path.relative(this.projectPath, imagePath);
            const ext = path.extname(imagePath).toLowerCase().replace('.', '') as ImageFormat;
            const metaPath = imagePath + '.meta';

            // 讀取圖片尺寸（從 meta 中取得）
            let width = 0;
            let height = 0;
            let hasCompression = false;
            let compressionPlatforms: string[] = [];
            let compressionFormats: string[] = [];

            if (fs.existsSync(metaPath)) {
                try {
                    const metaContent = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
                    const dimensions = this.getImageDimensions(metaContent);
                    width = dimensions.width;
                    height = dimensions.height;
                    hasCompression = this.checkMetaCompression(metaContent);
                    const details = this.getCompressionDetails(metaContent);
                    compressionPlatforms = details.platforms;
                    compressionFormats = details.formats;
                } catch (e) {
                    // meta 解析失敗，繼續
                }
            }

            // 判斷圖集歸屬
            const belongingAtlases = this.findBelongingAtlases(imagePath, atlases);
            const atlasNames = belongingAtlases.map(a => a.path);
            const atlasCompressed = belongingAtlases.length > 0 &&
                belongingAtlases.some(a => a.hasCompression);
            const atlasHasInvalidPreset = belongingAtlases.length > 0 &&
                belongingAtlases.some(a => a.hasInvalidPreset);

            // 決定分類
            const category = this.determineCategory(
                hasCompression,
                belongingAtlases.length > 0,
                atlasCompressed,
                atlasHasInvalidPreset
            );

            // 預估壓縮後大小
            const estimatedCompressedSize = this.estimateCompressedSize(fileSize, width, height, ext);
            const estimatedSaving = category === CompressionCategory.LOOSE_UNCOMPRESSED ||
                category === CompressionCategory.ATLAS_UNCOMPRESSED ||
                category === CompressionCategory.ATLAS_INVALID_PRESET
                ? Math.max(0, fileSize - estimatedCompressedSize)
                : 0;

            // 建議動作
            const suggestion = this.getSuggestion(category, belongingAtlases);

            return {
                relativePath,
                absolutePath: imagePath,
                fileSize,
                width,
                height,
                format: ext as ImageFormat,
                hasCompression,
                compressionPlatforms,
                compressionFormats,
                category,
                atlasNames,
                atlasCompressed,
                estimatedCompressedSize,
                estimatedSaving,
                suggestion,
            };
        } catch (e) {
            console.warn(`[ImageCompressionChecker] 無法分析圖片: ${imagePath}`, e);
            return null;
        }
    }

    /**
     * 判斷圖片所屬的圖集
     */
    private findBelongingAtlases(imagePath: string, atlases: AtlasInfo[]): AtlasInfo[] {
        const results: AtlasInfo[] = [];

        for (const atlas of atlases) {
            if (atlas.type === 'auto-atlas') {
                // Auto Atlas 包含其所在資料夾及子資料夾下的所有圖片
                const imageDir = path.dirname(imagePath);
                if (imageDir.startsWith(atlas.coveragePath) || imageDir === atlas.coveragePath) {
                    results.push(atlas);
                }
            }
            // SpriteAtlas 的判斷需要讀取其內容來確認包含哪些圖片
            // 此處可擴展
        }

        return results;
    }

    /**
     * 決定圖片的壓縮分類
     */
    private determineCategory(
        hasOwnCompression: boolean,
        isInAtlas: boolean,
        atlasIsCompressed: boolean,
        atlasHasInvalidPreset: boolean
    ): CompressionCategory {
        if (isInAtlas) {
            if (atlasHasInvalidPreset) {
                return CompressionCategory.ATLAS_INVALID_PRESET;
            }
            return atlasIsCompressed
                ? CompressionCategory.ATLAS_COMPRESSED
                : CompressionCategory.ATLAS_UNCOMPRESSED;
        } else {
            return hasOwnCompression
                ? CompressionCategory.LOOSE_COMPRESSED
                : CompressionCategory.LOOSE_UNCOMPRESSED;
        }
    }

    /**
     * 檢查 meta 檔案中是否有設定紋理壓縮
     * 判斷標準：useCompressTexture=true 且 presetId 存在於專案有效 preset 列表中
     */
    private checkMetaCompressionStatus(metaContent: any): 'valid' | 'invalid_preset' | 'none' {
        const checkSettings = (settings: any): 'valid' | 'invalid_preset' | 'none' => {
            if (!settings || typeof settings !== 'object') return 'none';

            // 格式一：Preset 模式
            if (settings.useCompressTexture === true) {
                const presetId = settings.presetId;
                // presetId 為空 → 未壓縮
                if (!presetId || (typeof presetId === 'string' && presetId.trim() === '')) {
                    return 'none';
                }
                // 驗證 presetId 是否存在於有效列表中
                if (!this.validPresetIds.includes(presetId)) {
                    return 'none'; // preset 已被刪除 → 視為未壓縮
                }
                return 'valid';
            }

            // 格式二：直接設定各平台
            for (const [key, value] of Object.entries(settings)) {
                if (key === 'useCompressTexture' || key === 'presetId') continue;
                if (value && typeof value === 'object') {
                    return 'valid';
                }
            }

            return 'none';
        };

        // 檢查頂層 userData.compressSettings
        if (metaContent.userData?.compressSettings) {
            const status = checkSettings(metaContent.userData.compressSettings);
            if (status !== 'none') return status;
        }

        // 檢查 subMetas 中每個子資源的 compressSettings
        if (metaContent.subMetas) {
            for (const key of Object.keys(metaContent.subMetas)) {
                const subMeta = metaContent.subMetas[key];
                if (subMeta?.userData?.compressSettings) {
                    const status = checkSettings(subMeta.userData.compressSettings);
                    if (status !== 'none') return status;
                }
            }
        }

        return 'none';
    }

    /**
     * 向後相容的 boolean 版本
     */
    private checkMetaCompression(metaContent: any): boolean {
        return this.checkMetaCompressionStatus(metaContent) === 'valid';
    }

    /**
     * 取得壓縮設定的詳細資訊
     */
    private getCompressionDetails(metaContent: any): { platforms: string[]; formats: string[] } {
        const platforms: Set<string> = new Set();
        const formats: Set<string> = new Set();

        const extractFromSettings = (settings: any) => {
            if (!settings || typeof settings !== 'object') return;
            for (const [platform, config] of Object.entries(settings)) {
                if (config && typeof config === 'object') {
                    platforms.add(platform);
                    const cfg = config as any;
                    if (cfg.format) {
                        formats.add(cfg.format);
                    }
                }
            }
        };

        // 檢查頂層
        if (metaContent.userData?.compressSettings) {
            extractFromSettings(metaContent.userData.compressSettings);
        }

        // 檢查 subMetas
        if (metaContent.subMetas) {
            for (const key of Object.keys(metaContent.subMetas)) {
                const subMeta = metaContent.subMetas[key];
                if (subMeta?.userData?.compressSettings) {
                    extractFromSettings(subMeta.userData.compressSettings);
                }
            }
        }

        return {
            platforms: Array.from(platforms),
            formats: Array.from(formats),
        };
    }

    /**
     * 從 meta 中取得圖片尺寸
     */
    private getImageDimensions(metaContent: any): { width: number; height: number } {
        // Cocos Creator 3.x 圖片尺寸通常存在 subMetas 中
        if (metaContent.subMetas) {
            for (const key of Object.keys(metaContent.subMetas)) {
                const subMeta = metaContent.subMetas[key];
                if (subMeta?.userData) {
                    const w = subMeta.userData.width || subMeta.userData.rawWidth || 0;
                    const h = subMeta.userData.height || subMeta.userData.rawHeight || 0;
                    if (w > 0 && h > 0) {
                        return { width: w, height: h };
                    }
                }
            }
        }

        // 頂層 userData
        if (metaContent.userData) {
            const w = metaContent.userData.width || metaContent.userData.rawWidth || 0;
            const h = metaContent.userData.height || metaContent.userData.rawHeight || 0;
            if (w > 0 && h > 0) {
                return { width: w, height: h };
            }
        }

        return { width: 0, height: 0 };
    }

    /**
     * 預估壓縮後的檔案大小
     * 根據圖片尺寸和格式估算使用 WebP 或 ETC2 壓縮後的大小
     */
    private estimateCompressedSize(fileSize: number, width: number, height: number, format: string): number {
        if (width === 0 || height === 0) {
            // 無法判斷尺寸時，以 70% 壓縮率估算
            return Math.floor(fileSize * 0.3);
        }

        const pixels = width * height;

        // WebP 壓縮估算：大約 0.5~2 bytes/pixel（有損）
        // ETC2 壓縮：固定 1 byte/pixel（RGBA）或 0.5 byte/pixel（RGB）
        // 這裡使用保守估算
        const estimatedWebP = Math.floor(pixels * 1.0); // ~1 byte/pixel
        const estimatedETC2 = Math.floor(pixels * 1.0); // ETC2 RGBA = 8 bits/pixel = 1 byte/pixel

        // 取兩者較小值
        const estimated = Math.min(estimatedWebP, estimatedETC2);

        // 不能比原始大小大
        return Math.min(estimated, fileSize);
    }

    /**
     * 根據分類產生建議動作
     */
    private getSuggestion(category: CompressionCategory, atlases: AtlasInfo[]): string {
        switch (category) {
            case CompressionCategory.LOOSE_UNCOMPRESSED:
                return '⚠️ 建議：打包進圖集並設定紋理壓縮（WebP/ETC2/ASTC），或單獨設定壓縮';
            case CompressionCategory.ATLAS_UNCOMPRESSED:
                const atlasPath1 = atlases.length > 0 ? atlases[0].path : '';
                return `⚠️ 建議：為圖集 [${atlasPath1}] 設定紋理壓縮格式`;
            case CompressionCategory.ATLAS_INVALID_PRESET:
                const atlasPath2 = atlases.length > 0 ? atlases[0].path : '';
                return `⚠️ 圖集 [${atlasPath2}] 壓縮 Preset Id 為空，壓縮不會生效`;
            case CompressionCategory.LOOSE_COMPRESSED:
                return '💡 提示：已壓縮但未入圖集，建議打包圖集以降低 Draw Call';
            case CompressionCategory.ATLAS_COMPRESSED:
                return '✅ 良好：已入圖集且已壓縮';
            default:
                return '';
        }
    }

    /** bmFont 關聯的圖片 UUID 集合（lazy 載入） */
    private _bmFontTextureUuids: Set<string> | null = null;

    /**
     * 判斷圖片是否為 bmFont 關聯圖片
     * 透過掃描所有 .fnt.meta 中的 textureUuid 來比對
     */
    private isBmFontImage(imagePath: string): boolean {
        // lazy 載入 bmFont 的 texture UUID 集合
        if (this._bmFontTextureUuids === null) {
            this._bmFontTextureUuids = this.collectBmFontTextureUuids();
        }

        // 讀取圖片的 UUID
        const metaPath = imagePath + '.meta';
        if (!fs.existsSync(metaPath)) return false;

        try {
            const metaContent = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            const imageUuid = metaContent.uuid;
            if (imageUuid && this._bmFontTextureUuids.has(imageUuid)) {
                return true;
            }
        } catch (e) {}

        return false;
    }

    /**
     * 掃描所有 .fnt.meta 檔案，收集 textureUuid
     */
    private collectBmFontTextureUuids(): Set<string> {
        const uuids = new Set<string>();

        this.walkDirectory(this.assetsPath, (filePath) => {
            if (filePath.endsWith('.fnt.meta')) {
                try {
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    const textureUuid = content?.userData?.textureUuid;
                    if (textureUuid && typeof textureUuid === 'string') {
                        uuids.add(textureUuid);
                    }
                } catch (e) {}
            }
        });

        return uuids;
    }

    /**
     * 遞迴遍歷目錄
     */
    private walkDirectory(dirPath: string, callback: (filePath: string) => void): void {
        if (!fs.existsSync(dirPath)) return;

        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                this.walkDirectory(fullPath, callback);
            } else if (entry.isFile()) {
                callback(fullPath);
            }
        }
    }

    /**
     * 格式化檔案大小
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = (bytes / Math.pow(1024, i)).toFixed(2);
        return `${size} ${units[i]}`;
    }
}
