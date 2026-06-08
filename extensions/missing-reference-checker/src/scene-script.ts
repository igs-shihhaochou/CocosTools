/**
 * Scene Script — 在場景環境中執行，可存取 cc 模組
 * 透過 Editor.Message.request('scene', 'execute-scene-script', ...) 呼叫
 */

// @ts-ignore — cc module is available in scene context
import { director, Node, js, CCObject } from 'cc';

/**
 * 掃描當前場景中的所有節點，檢查是否有 Missing Script 或 Missing Asset
 */
export function scanScene(): { results: any[]; totalNodes: number } {
    const results: any[] = [];
    const scene = director.getScene();
    if (!scene) return { results: [], totalNodes: 0 };

    let totalNodes = 0;

    function traverse(node: Node, path: string) {
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
                const serialized = (comp as any)._$erialized || (comp as any).__serialized;
                const typeInfo = serialized?.__type__ || 'Unknown';
                results.push({
                    nodePath: currentPath,
                    nodeUuid: node.uuid,
                    missingType: 'script',
                    detail: typeInfo,
                    componentIndex: i,
                });
                continue;
            }

            // 檢查 3: 遍歷元件所有屬性，找 Missing Asset
            scanComponentForMissingAssets(comp, currentPath, node.uuid, i, className, results);
        }

        // 遞迴子節點
        for (let i = 0; i < node.children.length; i++) {
            traverse(node.children[i], currentPath);
        }
    }

    for (let i = 0; i < scene.children.length; i++) {
        traverse(scene.children[i], '');
    }

    return { results, totalNodes };
}

/**
 * 掃描元件的所有屬性，找出 Missing Asset
 * 
 * 策略：直接遍歷物件的所有 key，檢查值是否為
 * - CCObject 且 isValid === false
 * - 或有特殊的 missing 標記
 */
function scanComponentForMissingAssets(
    comp: any,
    nodePath: string,
    nodeUuid: string,
    componentIndex: number,
    className: string,
    results: any[]
): void {
    const checked = new Set<string>();

    // 方法一：用 comp.constructor.__attrs__ 取得 @property 定義的屬性
    try {
        const ctor = comp.constructor;
        if (ctor && ctor.__attrs__) {
            const attrs = ctor.__attrs__;
            // __attrs__ 的 key 格式: "propName|type", "propName|default" 等
            const propNames = new Set<string>();
            for (const attrKey of Object.keys(attrs)) {
                const parts = attrKey.split('|');
                if (parts[0]) propNames.add(parts[0]);
            }

            for (const propName of propNames) {
                if (checked.has(propName)) continue;
                checked.add(propName);
                checkPropertyValue(comp, propName, nodePath, nodeUuid, componentIndex, className, results);
            }
        }
    } catch (e) {
        // 忽略
    }

    // 方法二：直接遍歷實例上以 _ 開頭的序列化屬性
    try {
        const keys = Object.keys(comp);
        for (const key of keys) {
            if (checked.has(key)) continue;
            // Cocos 的序列化屬性通常以 _ 開頭
            if (!key.startsWith('_')) continue;
            // 跳過內部屬性
            if (key.startsWith('__') || key === '_name' || key === '_objFlags' ||
                key === '_enabled' || key === '_id' || key === '_parent' ||
                key === '_children' || key === '_components' || key === '_prefab' ||
                key === '_lpos' || key === '_lrot' || key === '_lscale' || key === '_layer' ||
                key === '_euler' || key === '_active') continue;

            checked.add(key);
            checkPropertyValue(comp, key, nodePath, nodeUuid, componentIndex, className, results);
        }
    } catch (e) {
        // 忽略
    }
}

/**
 * 檢查單一屬性值是否為 Missing Asset
 */
function checkPropertyValue(
    comp: any,
    propName: string,
    nodePath: string,
    nodeUuid: string,
    componentIndex: number,
    className: string,
    results: any[]
): void {
    try {
        const value = comp[propName];
        if (value === null || value === undefined) return;

        // 單一值：如果是 CCObject 且 isValid 為 false → Missing Asset
        if (typeof value === 'object' && value instanceof CCObject) {
            if (!value.isValid) {
                const displayName = propName.startsWith('_') ? propName.slice(1) : propName;
                results.push({
                    nodePath,
                    nodeUuid,
                    missingType: 'asset',
                    detail: `${className}.${displayName} (Missing Asset)`,
                    componentIndex,
                });
            }
            return;
        }

        // 陣列：檢查每個元素
        if (Array.isArray(value)) {
            for (let j = 0; j < value.length; j++) {
                const item = value[j];
                if (item && typeof item === 'object' && item instanceof CCObject && !item.isValid) {
                    const displayName = propName.startsWith('_') ? propName.slice(1) : propName;
                    results.push({
                        nodePath,
                        nodeUuid,
                        missingType: 'asset',
                        detail: `${className}.${displayName}[${j}] (Missing Asset)`,
                        componentIndex,
                    });
                }
            }
        }
    } catch (e) {
        // 某些 getter 可能會拋錯，忽略
    }
}
