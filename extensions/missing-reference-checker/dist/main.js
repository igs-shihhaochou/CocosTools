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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const checker_1 = require("./checker");
/**
 * Cocos Creator 編輯器擴展主進程
 * Missing Reference Checker — 掃描場景/預製體中的 Missing 引用
 */
let _pendingScan = { type: '', target: '', version: 0 };
let _lastResult = null;
function load() {
    console.log('[MissingReferenceChecker] 插件已載入');
}
function unload() {
    console.log('[MissingReferenceChecker] 插件已卸載');
}
exports.methods = {
    openPanel() {
        Editor.Panel.open('missing-reference-checker.default');
    },
    /**
     * 掃描當前場景
     * 透過 Editor API 取得當前場景路徑，然後解析 .scene 檔案
     */
    async scanCurrentScene() {
        console.log('[MissingReferenceChecker] 掃描當前場景...');
        // 先開面板
        Editor.Panel.open('missing-reference-checker.default');
        try {
            const projectPath = Editor.Project.path;
            let sceneFilePath = '';
            // 方法一：取得當前場景 UUID，再查路徑
            try {
                const currentSceneUuid = await Editor.Message.request('scene', 'query-current-scene');
                if (currentSceneUuid) {
                    const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', currentSceneUuid);
                    if (assetInfo && assetInfo.file) {
                        sceneFilePath = assetInfo.file;
                    }
                }
            }
            catch (e) {
                console.warn('[MissingReferenceChecker] query-current-scene 失敗:', e);
            }
            // 方法二：找 assets 下的 .scene 檔案
            if (!sceneFilePath || !fs.existsSync(sceneFilePath)) {
                const scenes = findSceneFiles(path.join(projectPath, 'assets'));
                if (scenes.length > 0) {
                    sceneFilePath = scenes[0];
                }
            }
            if (!sceneFilePath || !fs.existsSync(sceneFilePath)) {
                console.error('[MissingReferenceChecker] 找不到任何場景檔案');
                return null;
            }
            console.log(`[MissingReferenceChecker] 場景路徑: ${sceneFilePath}`);
            const checker = new checker_1.MissingChecker(projectPath);
            _lastResult = checker.scanSceneFile(sceneFilePath);
            _pendingScan = { type: 'scene', target: sceneFilePath, version: _pendingScan.version + 1 };
            console.log(`[MissingReferenceChecker] 掃描完成: ${_lastResult.missingCount} 個 missing 引用`);
            return _lastResult;
        }
        catch (error) {
            console.error('[MissingReferenceChecker] 場景掃描失敗:', error);
            return null;
        }
    },
    /**
     * 掃描預製體
     */
    async scanPrefab(prefabPath) {
        if (!prefabPath)
            return null;
        console.log(`[MissingReferenceChecker] 掃描預製體: ${prefabPath}`);
        try {
            const projectPath = Editor.Project.path;
            const checker = new checker_1.MissingChecker(projectPath);
            _lastResult = checker.scanPrefabFile(prefabPath);
            _pendingScan = { type: 'prefab', target: prefabPath, version: _pendingScan.version + 1 };
            console.log(`[MissingReferenceChecker] Prefab 掃描完成: ${_lastResult.missingCount} 個 missing 引用`);
            return _lastResult;
        }
        catch (error) {
            console.error('[MissingReferenceChecker] Prefab 掃描失敗:', error);
            return null;
        }
    },
    getPendingScan() {
        return _pendingScan;
    },
    getLastResult() {
        return _lastResult;
    },
};
/**
 * 找出 assets 下的 .scene 檔案
 */
function findSceneFiles(assetsPath) {
    const scenes = [];
    function walk(dir) {
        if (!fs.existsSync(dir))
            return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.'))
                continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            }
            else if (entry.name.endsWith('.scene')) {
                scenes.push(fullPath);
            }
        }
    }
    walk(assetsPath);
    return scenes;
}
//# sourceMappingURL=main.js.map