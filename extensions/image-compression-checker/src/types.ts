/**
 * 圖片壓縮狀態分類
 */
export enum CompressionCategory {
    /** 散圖未壓縮（未入圖集 + 未壓縮）⚠️ 最高優先 */
    LOOSE_UNCOMPRESSED = 'loose_uncompressed',
    /** 圖集未壓縮（已入圖集但圖集未設定壓縮） */
    ATLAS_UNCOMPRESSED = 'atlas_uncompressed',
    /** 圖集 Preset 無效（已入圖集，啟用壓縮但 Preset Id 為空） */
    ATLAS_INVALID_PRESET = 'atlas_invalid_preset',
    /** 散圖已壓縮（未入圖集但已單獨壓縮）✓ */
    LOOSE_COMPRESSED = 'loose_compressed',
    /** 圖集已壓縮（已入圖集且圖集已壓縮）✓ */
    ATLAS_COMPRESSED = 'atlas_compressed',
}

/**
 * 圖片格式
 */
export enum ImageFormat {
    PNG = 'png',
    JPG = 'jpg',
    JPEG = 'jpeg',
    WEBP = 'webp',
    BMP = 'bmp',
    GIF = 'gif',
}

/**
 * 壓縮格式
 */
export enum TextureCompressFormat {
    NONE = 'none',
    ETC2 = 'etc2',
    ASTC = 'astc',
    PVRTC = 'pvrtc',
    WEBP = 'webp',
    PNG = 'png',
}

/**
 * 單張圖片的掃描結果
 */
export interface ImageScanResult {
    /** 相對於專案根目錄的路徑 */
    relativePath: string;
    /** 絕對路徑 */
    absolutePath: string;
    /** 檔案大小 (bytes) */
    fileSize: number;
    /** 圖片寬度 */
    width: number;
    /** 圖片高度 */
    height: number;
    /** 圖片格式 */
    format: ImageFormat;
    /** 是否有設定紋理壓縮 */
    hasCompression: boolean;
    /** 壓縮設定的平台列表 */
    compressionPlatforms: string[];
    /** 壓縮格式 */
    compressionFormats: string[];
    /** 壓縮狀態分類 */
    category: CompressionCategory;
    /** 所屬圖集路徑（可能屬於多個圖集） */
    atlasNames: string[];
    /** 圖集是否有壓縮設定 */
    atlasCompressed: boolean;
    /** 預估壓縮後大小 (bytes) */
    estimatedCompressedSize: number;
    /** 預估可節省空間 (bytes) */
    estimatedSaving: number;
    /** 建議動作 */
    suggestion: string;
}

/**
 * 圖集資訊
 */
export interface AtlasInfo {
    /** 圖集路徑 */
    path: string;
    /** 圖集類型 */
    type: 'auto-atlas' | 'sprite-atlas';
    /** 圖集是否已壓縮（有效壓縮） */
    hasCompression: boolean;
    /** 圖集是否有無效的 Preset（啟用壓縮但 presetId 為空） */
    hasInvalidPreset: boolean;
    /** 壓縮平台 */
    compressionPlatforms: string[];
    /** 壓縮格式 */
    compressionFormats: string[];
    /** 圖集涵蓋的資料夾路徑（Auto Atlas 會包含該資料夾下所有圖片） */
    coveragePath: string;
}

/**
 * 掃描設定
 */
export interface ScanOptions {
    /** 只掃描超過此大小的圖片 (bytes)，預設 0 表示全部 */
    minFileSize: number;
    /** 報告中顯示的大圖閾值 (bytes)，預設 100KB */
    largeFileThreshold: number;
    /** 要掃描的圖片格式 */
    imageExtensions: string[];
    /** 排除的路徑 pattern */
    excludePatterns: string[];
    /** 指定掃描的子資料夾絕對路徑（不設則掃描全 assets） */
    scanSubPath?: string;
}

/**
 * 完整掃描報告
 */
export interface ScanReport {
    /** 掃描時間 */
    scanTime: string;
    /** 掃描耗時 (ms) */
    duration: number;
    /** 專案路徑 */
    projectPath: string;

    /** 統計摘要 */
    summary: {
        totalImages: number;
        totalSize: number;
        totalSizeFormatted: string;

        looseUncompressedCount: number;
        looseUncompressedSize: number;

        atlasUncompressedCount: number;
        atlasUncompressedSize: number;

        looseCompressedCount: number;
        looseCompressedSize: number;

        atlasCompressedCount: number;
        atlasCompressedSize: number;

        notInAtlasCount: number;

        totalEstimatedSaving: number;
        totalEstimatedSavingFormatted: string;
    };

    /** 所有圖集資訊 */
    atlases: AtlasInfo[];

    /** 分類結果 */
    categories: {
        looseUncompressed: ImageScanResult[];
        atlasUncompressed: ImageScanResult[];
        looseCompressed: ImageScanResult[];
        atlasCompressed: ImageScanResult[];
    };

    /** 所有結果（按大小降序） */
    allResults: ImageScanResult[];
}

/**
 * Cocos Creator 圖片 meta 檔案格式（簡化）
 */
export interface ImageMetaFile {
    ver: string;
    importer: string;
    imported: boolean;
    uuid: string;
    files: string[];
    subMetas: Record<string, any>;
    userData: {
        hasAlpha?: boolean;
        type?: string;
        fixAlphaTransparencyArtifacts?: boolean;
        [key: string]: any;
    };
}

/**
 * Cocos Creator SpriteFrame subMeta 中的 platformSettings
 */
export interface PlatformSettings {
    [platform: string]: {
        format?: string;
        quality?: string | number;
        [key: string]: any;
    };
}
