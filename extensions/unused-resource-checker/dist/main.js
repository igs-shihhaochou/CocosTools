"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
exports.load = load;
exports.unload = unload;
const path = __importStar(require("path"));
const scanner_1 = require("./scanner");
/**
 * Cocos Creator 編輯器擴展主進程 - 未使用資源檢查工具
 */
let _pendingScanFolder = '';
let _scanVersion = 0;
function load() {
    console.log('[UnusedResourceChecker] 插件已載入');
}
function unload() {
    console.log('[UnusedResourceChecker] 插件已卸載');
}
exports.methods = {
    openPanel() {
        _pendingScanFolder = '';
        Editor.Panel.open('unused-resource-checker.default');
    },
    scanFolderByUrl(folderUrl) {
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
    async scanForPanel(options) {
        try {
            const projectPath = Editor.Project.path;
            let scanSubPath;
            if (options === null || options === void 0 ? void 0 : options.scanFolder) {
                const dbUrl = options.scanFolder;
                if (dbUrl.startsWith('db://assets/')) {
                    scanSubPath = path.join(projectPath, 'assets', dbUrl.replace('db://assets/', ''));
                }
                else if (dbUrl.startsWith('db://assets')) {
                    scanSubPath = path.join(projectPath, 'assets');
                }
            }
            if (!scanSubPath) {
                console.warn('[UnusedResourceChecker] 未指定掃描資料夾');
                return null;
            }
            const scanner = new scanner_1.UnusedResourceScanner(projectPath, scanSubPath);
            return await scanner.scan();
        }
        catch (error) {
            console.error('[UnusedResourceChecker] 掃描失敗:', error);
            return null;
        }
    },
    async deleteAssets(dbUrls) {
        let success = 0;
        let failed = 0;
        for (const url of dbUrls) {
            try {
                // 刪除資源本體
                await Editor.Message.request('asset-db', 'delete-asset', url);
                success++;
            }
            catch (e) {
                console.warn(`[UnusedResourceChecker] 刪除失敗: ${url}`, e);
                failed++;
            }
        }
        console.log(`[UnusedResourceChecker] 刪除完成: 成功 ${success}, 失敗 ${failed}`);
        return { success, failed };
    },
};
//# sourceMappingURL=main.js.map