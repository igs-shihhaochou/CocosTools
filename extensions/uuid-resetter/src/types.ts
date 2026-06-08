/**
 * UUID 映射項目
 */
export interface UuidMapping {
    /** 舊 UUID */
    oldUuid: string;
    /** 新 UUID */
    newUuid: string;
    /** 來源檔案路徑（.meta） */
    sourceFile: string;
    /** 是否為 subMeta UUID（含 @hash 後綴） */
    isSubMeta: boolean;
}

/**
 * 掃描結果：資料夾內所有 UUID 資訊
 */
export interface ScanResult {
    /** 掃描的資料夾路徑 */
    folderPath: string;
    /** 所有找到的 UUID 映射 */
    mappings: UuidMapping[];
    /** 主 UUID 數量（不含 subMeta） */
    mainUuidCount: number;
    /** subMeta UUID 數量 */
    subMetaUuidCount: number;
    /** 涉及的 .meta 檔案數量 */
    metaFileCount: number;
    /** 涉及的引用檔案數量（.prefab, .scene 等） */
    referenceFileCount: number;
}

/**
 * 重置執行結果
 */
export interface ResetResult {
    /** 是否成功 */
    success: boolean;
    /** 重置的 UUID 數量 */
    uuidResetCount: number;
    /** 更新的引用數量 */
    referenceUpdateCount: number;
    /** 修改的檔案數量 */
    modifiedFileCount: number;
    /** 耗時 (ms) */
    duration: number;
    /** UUID 映射表（舊→新） */
    mappings: UuidMapping[];
    /** 錯誤列表 */
    errors: Array<{ file: string; error: string }>;
}

/**
 * 重置預覽資訊（確認對話框用）
 */
export interface ResetPreview {
    /** 資料夾路徑 */
    folderPath: string;
    /** 將被重置的 UUID 數量 */
    uuidCount: number;
    /** 將被修改的檔案數量 */
    fileCount: number;
    /** 涉及的檔案類型統計 */
    fileTypes: Record<string, number>;
}
