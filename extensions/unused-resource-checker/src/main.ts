import * as path from 'path';
import { UnusedResourceScanner, ScanResult } from './scanner';

/**
 * Cocos Creator 編輯器擴展主進程 - 未使用資源檢查工具
 */

let _pendingScanFolder: string = '';
let _scanVersion: number = 0;

export function load() {
    console.log('[UnusedResourceChecker] 插件已載入');
}

export function unload() {
    console.log('[UnusedResourceChecker] 插件已卸載');
}

export const methods = {
    openPanel() {
        _pendingScanFolder = '';
        Editor.Panel.open('unused-resource-checker.default');
    },

    scanFolderByUrl(folderUrl: string) {
        if (!folderUrl) {
            console.warn('[UnusedResourceChecker] 未提供資料夾路徑');
            return;
        }
        console.log(`[UnusedResourceChecker] 檢查資料夾: ${folderUrl}`);
        _pendingScanFolder = folderUrl;
        _scanVersion++;
        Editor.Panel.open('unused-resource-checker.default');
    },

    getPendingScanFolder() {
        return { folder: _pendingScanFolder, version: _scanVersion };
    },

    async scanForPanel(options?: { scanFolder?: string }): Promise<ScanResult | null> {
        try {
            const projectPath = Editor.Project.path;
            let scanSubPath: string | undefined;

            if (options?.scanFolder) {
                const dbUrl = options.scanFolder;
                if (dbUrl.startsWith('db://assets/')) {
                    scanSubPath = path.join(projectPath, 'assets', dbUrl.replace('db://assets/', ''));
                } else if (dbUrl.startsWith('db://assets')) {
                    scanSubPath = path.join(projectPath, 'assets');
                }
            }

            if (!scanSubPath) {
                console.warn('[UnusedResourceChecker] 未指定掃描資料夾');
                return null;
            }

            const scanner = new UnusedResourceScanner(projectPath, scanSubPath);
            return await scanner.scan();
        } catch (error) {
            console.error('[UnusedResourceChecker] 掃描失敗:', error);
            return null;
        }
    },

    async deleteAssets(dbUrls: string[]): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const url of dbUrls) {
            try {
                // 刪除資源本體
                await Editor.Message.request('asset-db', 'delete-asset', url);
                success++;
            } catch (e) {
                console.warn(`[UnusedResourceChecker] 刪除失敗: ${url}`, e);
                failed++;
            }
        }

        console.log(`[UnusedResourceChecker] 刪除完成: 成功 ${success}, 失敗 ${failed}`);
        return { success, failed };
    },
};
