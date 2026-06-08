'use strict';

/**
 * Scene Script — 在場景環境中執行
 * 正確格式：exports.load, exports.unload, exports.methods
 * cc 模組透過 require('cc') 載入（需先加入引擎 module path）
 */

const { join } = require('path');
module.paths.push(join(Editor.App.path, 'node_modules'));

exports.load = function () {};

exports.unload = function () {};

exports.methods = {
    /**
     * 掃描當前場景中的所有節點，檢查是否有 Missing Script 或 Missing Asset
     */
    scanScene() {
        const { director, js, CCObject } = require('cc');
        const results = [];
        const scene = director.getScene();
        if (!scene) return { results: [], totalNodes: 0 };

        let totalNodes = 0;

        function traverse(node, path) {
            totalNodes++;
            const currentPath = path ? `${path}/${node.name}` : node.name;

            const components = node.components;
            for (let i = 0; i < components.length; i++) {
                const comp = components[i];

                // 檢查 1: 元件本身是 null 或 invalid
                if (!comp || !comp.isValid) {
                    results.push({
                        nodePath: currentPath,
                        nodeUuid: node.uuid,
                        missingType: 'script',
                        detail: 'Component is null or invalid',
                        componentIndex: i,
                    });
                    continue;
                }

                // 檢查 2: MissingScript 元件
                const className = js.getClassName(comp);
                if (className === 'cc.MissingScript' || className === 'MissingScript') {
                    const serialized = comp._$erialized || comp.__serialized;
                    const typeInfo = serialized ? (serialized.__type__ || 'Unknown') : 'Unknown';
                    results.push({
                        nodePath: currentPath,
                        nodeUuid: node.uuid,
                        missingType: 'script',
                        detail: typeInfo,
                        componentIndex: i,
                    });
                    continue;
                }

                // 檢查 3: 元件屬性中的 Missing Asset
                // 策略：遍歷所有 key，對值做多種檢查
                try {
                    const keys = Object.keys(comp);
                    for (const key of keys) {
                        if (key === '__prefab' || key === 'node' || key === '_enabled' ||
                            key === '_id' || key === '_name' || key === '_objFlags' ||
                            key === '__scriptAsset') continue;

                        let value;
                        try {
                            value = comp[key];
                        } catch (accessError) {
                            // 存取屬性拋錯 — 可能是已銷毀的引用
                            const displayName = key.startsWith('_') ? key.slice(1) : key;
                            results.push({
                                nodePath: currentPath,
                                nodeUuid: node.uuid,
                                missingType: 'asset',
                                detail: `${className}.${displayName} (Access Error - possible missing)`,
                                componentIndex: i,
                            });
                            continue;
                        }

                        if (value === null || value === undefined) continue;

                        // 值是物件且 isValid 為 false（destroyed or missing）
                        if (typeof value === 'object' && 'isValid' in value && value.isValid === false) {
                            const displayName = key.startsWith('_') ? key.slice(1) : key;
                            results.push({
                                nodePath: currentPath,
                                nodeUuid: node.uuid,
                                missingType: 'asset',
                                detail: `${className}.${displayName} (Missing Asset)`,
                                componentIndex: i,
                            });
                            continue;
                        }

                        // 陣列中的 missing
                        if (Array.isArray(value)) {
                            for (let j = 0; j < value.length; j++) {
                                const item = value[j];
                                if (item && typeof item === 'object' && 'isValid' in item && item.isValid === false) {
                                    const displayName = key.startsWith('_') ? key.slice(1) : key;
                                    results.push({
                                        nodePath: currentPath,
                                        nodeUuid: node.uuid,
                                        missingType: 'asset',
                                        detail: `${className}.${displayName}[${j}] (Missing Asset)`,
                                        componentIndex: i,
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {
                    // 忽略
                }
            }

            // 遞迴子節點
            const children = node.children;
            for (let i = 0; i < children.length; i++) {
                traverse(children[i], currentPath);
            }
        }

        const children = scene.children;
        for (let i = 0; i < children.length; i++) {
            traverse(children[i], '');
        }

        return { results, totalNodes };
    },
};
