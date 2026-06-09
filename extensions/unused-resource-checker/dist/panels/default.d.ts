/**
 * 未使用資源檢查 - 面板 UI
 */
interface UnusedAssetInfo {
    filePath: string;
    dbUrl: string;
    uuid: string;
    fileSize: number;
    extension: string;
}
interface ScanResult {
    scanFolder: string;
    scanFolderUrl: string;
    totalAssets: number;
    unusedAssets: UnusedAssetInfo[];
    elapsed: number;
}
