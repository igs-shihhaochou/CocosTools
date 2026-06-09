export interface UnusedAssetInfo {
    /** 資源檔案的絕對路徑 */
    filePath: string;
    /** db:// URL */
    dbUrl: string;
    /** 資源 UUID */
    uuid: string;
    /** 檔案大小 (bytes) */
    fileSize: number;
    /** 資源類型 (副檔名) */
    extension: string;
}
export interface ScanResult {
    /** 掃描資料夾路徑 */
    scanFolder: string;
    /** 掃描資料夾的 db:// URL */
    scanFolderUrl: string;
    /** 資料夾下總資源數 */
    totalAssets: number;
    /** 未被引用的資源 */
    unusedAssets: UnusedAssetInfo[];
    /** 掃描耗時 (ms) */
    elapsed: number;
}
export declare class UnusedResourceScanner {
    private projectPath;
    private scanPath;
    private assetsPath;
    constructor(projectPath: string, scanPath: string);
    scan(): Promise<ScanResult>;
    /**
     * 收集掃描目標資料夾下的所有資源（讀取 .meta 取得 UUID）
     */
    private collectTargetAssets;
    /**
     * 遞迴解析 subMetas 中的所有 UUID
     */
    private collectSubMetaUuids;
    /**
     * 掃描 assets 資料夾，找出引用了目標 UUID 的情況
     * 注意：不排除任何檔案，因為 prefab/scene/anim 等同時可以是資源也是引用來源
     */
    private findReferencedUuids;
    /**
     * 檢查 Spine 的引用鏈：spine-data → atlas → png
     * 如果 spine data 被使用（UUID 被引用），則它關聯的 atlas 和 png 也算被使用
     * 同時也處理反向：如果目標中有 atlas/png，找出它是否被某個被使用的 spine 引用
     */
    private findSpineAtlasReferences;
    /**
     * 檢查 BMFont 的引用鏈：fnt → png (textureUuid)
     * 如果 .fnt 被使用，則它關聯的 png（textureUuid）也算被使用
     */
    private findBitmapFontReferences;
    /**
     * 解析 atlas 檔案，標記它引用的圖片為已使用
     */
    private markAtlasImages;
    /**
     * 透過 UUID 反查 atlas 的實際檔案路徑
     */
    private findAtlasPathByUuid;
    /**
     * 遞迴遍歷目錄
     */
    private walkDir;
    /**
     * 將絕對路徑轉為 db:// URL
     */
    private pathToDbUrl;
}
