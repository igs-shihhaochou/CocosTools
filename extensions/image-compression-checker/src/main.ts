import * as path from 'path';
import { ImageCompressionScanner } from './scanner';
import { ReportGenerator } from './reporter';
import { ImageCompressor, BatchCompressRequest } from './compressor';

/**
 * Cocos Creator 編輯器擴展主進程
 */

/** 暫存：右鍵觸發時指定的掃描資料夾 URL */
let _pendingScanFolder: string = '';
/** 掃描版本號，每次右鍵觸發時遞增，面板靠此判斷是否有新指令 */
let _scanVersion: number = 0;

/**
 * 擴展啟動時呼叫
 */
export function load() {
    console.log('[ImageCompressionChecker] 插件已載入');
}

/**
 * 擴展關閉時呼叫
 */
export function unload() {
    console.log('[ImageCompressionChecker] 插件已卸載');
}

/**
 * 擴展的訊息處理
 */
export const methods = {
    /**
     * 開啟面板
     */
    openPanel() {
        _pendingScanFolder = ''; // 從選單開啟 = 掃全專案
        Editor.Panel.open('image-compression-checker.default');
    },

    /**
     * 快速掃描（Console 輸出）
     */
    async scanQuick() {
        console.log('[ImageCompressionChecker] 開始快速掃描...');

        try {
            const projectPath = Editor.Project.path;
            const scanner = new ImageCompressionScanner(projectPath, {
                minFileSize: 0,
                largeFileThreshold: 100 * 1024,
            });

            const report = await scanner.scan();

            const textReport = ReportGenerator.generateConsoleReport(report);
            console.log(textReport);

            const folderReport = ReportGenerator.generateGroupedByFolderReport(report);
            console.log(folderReport);

            const atlasReport = ReportGenerator.generateGroupedByAtlasReport(report);
            console.log(atlasReport);

            console.log('[ImageCompressionChecker] 掃描完成');
        } catch (error) {
            console.error('[ImageCompressionChecker] 掃描失敗:', error);
        }
    },

    /**
     * 右鍵資源管理器 → 掃描指定資料夾（透過 URL）
     * 由 assets-menu.js 的 click 事件呼叫
     */
    async scanFolderByUrl(folderUrl: string) {
        if (!folderUrl) {
            console.warn('[ImageCompressionChecker] 未提供資料夾路徑');
            return;
        }

        console.log(`[ImageCompressionChecker] 掃描資料夾: ${folderUrl}`);

        // 每次都更新待掃描路徑（面板透過輪詢取得）
        _pendingScanFolder = folderUrl;
        _scanVersion++;

        // 開啟面板（若已開啟則不會重複建立）
        Editor.Panel.open('image-compression-checker.default');
    },

    /**
     * 右鍵資源管理器 → 掃描指定資料夾（透過 UUID）
     */
    async scanFolder(...args: any[]) {
        const uuids: string[] = args.length > 0 ? args[0] : [];

        if (!uuids || uuids.length === 0) {
            console.warn('[ImageCompressionChecker] 未選擇資料夾');
            return;
        }

        try {
            const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', uuids[0]);
            if (!assetInfo || !assetInfo.url) {
                console.warn('[ImageCompressionChecker] 無法取得資源路徑');
                return;
            }

            // 透過 scanFolderByUrl 統一處理
            methods.scanFolderByUrl(assetInfo.url);
        } catch (error) {
            console.error('[ImageCompressionChecker] 掃描資料夾失敗:', error);
        }
    },

    /**
     * 面板呼叫：取得待掃描的資料夾路徑和版本號
     * 面板透過輪詢此方法，判斷是否有新的掃描指令
     */
    getPendingScanFolder() {
        return {
            folder: _pendingScanFolder,
            version: _scanVersion,
        };
    },

    /**
     * 供面板呼叫的掃描方法
     */
    async scanForPanel(options?: {
        minFileSize?: number;
        largeFileThreshold?: number;
        scanFolder?: string;
    }) {
        try {
            const projectPath = Editor.Project.path;

            // 如果有指定資料夾，轉換 db:// URL 為絕對路徑
            let scanSubPath: string | undefined;
            if (options?.scanFolder) {
                const dbUrl = options.scanFolder;
                if (dbUrl.startsWith('db://assets/')) {
                    const relativePart = dbUrl.replace('db://assets/', '');
                    scanSubPath = path.join(projectPath, 'assets', relativePart);
                } else if (dbUrl.startsWith('db://assets')) {
                    scanSubPath = path.join(projectPath, 'assets');
                }
            }

            // 嘗試取得專案有效的壓縮 preset ID 列表
            // 不再需要驗證 presetId 是否存在，只看有沒有被設定

            const scanner = new ImageCompressionScanner(projectPath, {
                minFileSize: options?.minFileSize || 0,
                largeFileThreshold: options?.largeFileThreshold || 100 * 1024,
                scanSubPath,
            });

            const report = await scanner.scan();
            return report;
        } catch (error) {
            console.error('[ImageCompressionChecker] 掃描失敗:', error);
            return null;
        }
    },

    /**
     * 批次套用壓縮設定
     */
    async batchCompress(request: BatchCompressRequest) {
        try {
            console.log(`[ImageCompressionChecker] 批次壓縮: ${request.imagePaths.length} 張, 格式: ${request.format}`);
            const result = ImageCompressor.batchSetCompression(request);
            console.log(`[ImageCompressionChecker] 批次壓縮完成: 成功 ${result.success}, 失敗 ${result.failed}`);

            for (const imgPath of request.imagePaths) {
                try {
                    await Editor.Message.request('asset-db', 'refresh-asset', imgPath);
                } catch (e) {
                    // 靜默處理
                }
            }

            return result;
        } catch (error) {
            console.error('[ImageCompressionChecker] 批次壓縮失敗:', error);
            return { success: 0, failed: request.imagePaths.length, errors: [] };
        }
    },
};
