import * as fs from 'fs';
import * as path from 'path';
import { MissingInfo, ScanResult } from './types';

const BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const BASE64_VALUES = new Array(123);
for (let i = 0; i < 123; ++i) BASE64_VALUES[i] = 64;
for (let i = 0; i < 64; ++i) BASE64_VALUES[BASE64_KEYS.charCodeAt(i)] = i;

// Detects missing script and asset references in Cocos Creator scene/prefab files
// by parsing JSON arrays, building node path indices, and cross-referencing
// against the project's valid UUID set collected from meta files and internal data.
export class MissingChecker {
    private projectPath: string;
    // All valid UUIDs collected from .meta files and engine internal data
    private validUuids: Set<string>;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
        this.validUuids = this.collectAllUuids();
    }

    // Scan a .scene or .prefab file and return the scan result
    scanSceneFile(filePath: string): ScanResult {
        const startTime = Date.now();
        const data = this.readJsonFile(filePath);

        if (!data || !Array.isArray(data)) {
            return {
                source: path.basename(filePath),
                totalNodes: 0,
                missingCount: 0,
                results: [],
                duration: Date.now() - startTime,
            };
        }

        const results = this.analyzeJsonData(data);

        return {
            source: path.basename(filePath),
            totalNodes: this.countNodes(data),
            missingCount: results.length,
            results,
            duration: Date.now() - startTime,
        };
    }

    // Alias for scanning prefab files (same format as scene)
    scanPrefabFile(filePath: string): ScanResult {
        return this.scanSceneFile(filePath);
    }

    // Analyze JSON data array to find all missing references
    private analyzeJsonData(data: any[]): MissingInfo[] {
        const results: MissingInfo[] = [];
        const nodeMap = this.buildNodeMap(data);

        // 第一遍：收集所有 missing script 的 index
        const missingScriptIndices = new Set<number>();

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (!item || typeof item !== 'object' || !item.__type__) continue;

            // Case 1: Explicit cc.MissingScript type
            if (item.__type__ === 'cc.MissingScript') {
                missingScriptIndices.add(i);
                const ownerNodeId = this.findOwnerNode(data, i);
                if (ownerNodeId === -1) continue;
                const nodePath = this.buildNodePath(ownerNodeId, nodeMap);
                const nodeUuid = data[ownerNodeId]?._id || '';
                const serialized = item._$erialized || {};
                const detail = serialized.__type__ || 'Unknown script';

                results.push({
                    nodePath,
                    nodeUuid,
                    missingType: 'script',
                    detail,
                    componentIndex: this.getComponentIndex(data, ownerNodeId, i),
                });
                continue;
            }

            // Case 2: Compressed UUID as __type__ (custom script reference)
            const typeStr = item.__type__;
            if (
                !typeStr.startsWith('cc.') &&
                !typeStr.startsWith('CC') &&
                !typeStr.startsWith('sp.') &&
                !typeStr.startsWith('dragonBones.') &&
                typeStr.length >= 22 &&
                typeStr.length <= 25
            ) {
                const decompressed = this.decompressUuid(typeStr);
                const mainUuid = decompressed.split('@')[0];

                if (!this.validUuids.has(mainUuid) && !this.validUuids.has(decompressed)) {
                    missingScriptIndices.add(i);
                    const ownerNodeId = this.findOwnerNode(data, i);
                    if (ownerNodeId === -1) continue;
                    const nodePath = this.buildNodePath(ownerNodeId, nodeMap);
                    const nodeUuid = data[ownerNodeId]?._id || '';

                    results.push({
                        nodePath,
                        nodeUuid,
                        missingType: 'script',
                        detail: typeStr,
                        componentIndex: this.getComponentIndex(data, ownerNodeId, i),
                    });
                    continue;
                }
            }
        }

        // 第二遍：檢查 Missing Asset（__uuid__ 引用）和 Missing Component（__id__ 引用指向 missing script）
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (!item || typeof item !== 'object' || !item.__type__) continue;
            // 跳過已經被標為 missing script 的物件本身
            if (missingScriptIndices.has(i)) continue;

            this.findMissingRefs(item, data, i, nodeMap, results, missingScriptIndices);
        }

        return results;
    }

    // Recursively search for missing references:
    // 1. { "__uuid__": "xxx" } where UUID doesn't exist
    // 2. { "__id__": X } where X is in the missingScriptIndices set (confirmed missing)
    private findMissingRefs(
        obj: any,
        data: any[],
        itemIndex: number,
        nodeMap: Map<number, { name: string; parentId: number | null }>,
        results: MissingInfo[],
        missingScriptIndices: Set<number>,
        propertyPath: string = ''
    ): void {
        if (!obj || typeof obj !== 'object') return;

        // Check __uuid__ reference (missing asset)
        if ('__uuid__' in obj && typeof obj.__uuid__ === 'string' && obj.__uuid__ !== '') {
            const uuid = obj.__uuid__;
            const mainUuid = uuid.split('@')[0];

            if (!this.validUuids.has(mainUuid) && !this.validUuids.has(uuid)) {
                const ownerNodeId = this.findOwnerNode(data, itemIndex);
                const nodePath = ownerNodeId !== -1
                    ? this.buildNodePath(ownerNodeId, nodeMap)
                    : 'Unknown';
                const nodeUuid = ownerNodeId !== -1
                    ? (data[ownerNodeId]?._id || '')
                    : '';
                const componentType = data[itemIndex]?.__type__ || '';
                const detail = propertyPath
                    ? `${componentType}.${propertyPath} (uuid: ${uuid})`
                    : `uuid: ${uuid}`;
                const isDuplicate = results.some(
                    r => r.nodePath === nodePath && r.detail === detail
                );
                if (!isDuplicate) {
                    results.push({
                        nodePath,
                        nodeUuid,
                        missingType: 'asset',
                        detail,
                        componentIndex: this.getComponentIndex(data, ownerNodeId, itemIndex),
                    });
                }
            }
            return;
        }

        // Check __id__ reference — only report if target is confirmed missing script
        if ('__id__' in obj && typeof obj.__id__ === 'number') {
            const refId = obj.__id__;
            if (missingScriptIndices.has(refId)) {
                const ownerNodeId = this.findOwnerNode(data, itemIndex);
                if (ownerNodeId !== -1) {
                    const nodePath = this.buildNodePath(ownerNodeId, nodeMap);
                    const nodeUuid = data[ownerNodeId]?._id || '';
                    const componentType = data[itemIndex]?.__type__ || '';
                    const refType = data[refId]?.__type__ || 'Unknown';
                    const detail = propertyPath
                        ? `${componentType}.${propertyPath} (Missing Component: ${refType})`
                        : `${componentType} (Missing Component)`;
                    const isDuplicate = results.some(r => r.nodePath === nodePath && r.detail === detail);
                    if (!isDuplicate) {
                        results.push({
                            nodePath,
                            nodeUuid,
                            missingType: 'script',
                            detail,
                            componentIndex: this.getComponentIndex(data, ownerNodeId, itemIndex),
                        });
                    }
                }
            }
            return;
        }

        // Recurse into object properties, skipping __type__
        for (const [key, value] of Object.entries(obj)) {
            if (key === '__type__') continue;
            if (value && typeof value === 'object') {
                if (Array.isArray(value)) {
                    for (let j = 0; j < value.length; j++) {
                        if (value[j] && typeof value[j] === 'object') {
                            this.findMissingRefs(
                                value[j], data, itemIndex, nodeMap, results,
                                missingScriptIndices, `${key}[${j}]`
                            );
                        }
                    }
                } else {
                    this.findMissingRefs(
                        value, data, itemIndex, nodeMap, results,
                        missingScriptIndices, key
                    );
                }
            }
        }
    }

    // Decompress a 23-char compressed UUID to full hex format
    // Format: first 5 hex chars + 18 base64 chars encoding remaining 27 hex chars (108 bits)
    private decompressUuid(compressed: string): string {
        if (compressed.length !== 23) return compressed;

        const first5 = compressed.slice(0, 5);
        const b64Part = compressed.slice(5);

        let bits = '';
        for (const ch of b64Part) {
            const val = BASE64_VALUES[ch.charCodeAt(0)];
            bits += val.toString(2).padStart(6, '0');
        }

        let hex = first5;
        for (let i = 0; i < 108; i += 4) {
            hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
        }

        // Format as standard UUID: 8-4-4-4-12
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }

    // Build node path index from cc.Node items in the data array
    private buildNodeMap(data: any[]): Map<number, { name: string; parentId: number | null }> {
        const nodeMap = new Map<number, { name: string; parentId: number | null }>();
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (item?.__type__ === 'cc.Node') {
                const parentId = item._parent?.__id__ ?? null;
                nodeMap.set(i, { name: item._name || 'unnamed', parentId });
            }
        }
        return nodeMap;
    }

    // Find the owner cc.Node for a component by searching _components arrays
    private findOwnerNode(data: any[], componentIndex: number): number {
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (item?.__type__ === 'cc.Node' && item._components) {
                for (const comp of item._components) {
                    if (comp?.__id__ === componentIndex) {
                        return i;
                    }
                }
            }
        }
        return -1;
    }

    // Build full node path by traversing parent chain
    private buildNodePath(
        nodeId: number,
        nodeMap: Map<number, { name: string; parentId: number | null }>
    ): string {
        const parts: string[] = [];
        let currentId: number | null = nodeId;
        let maxDepth = 50;

        while (currentId !== null && maxDepth-- > 0) {
            const node = nodeMap.get(currentId);
            if (!node) break;
            parts.unshift(node.name);
            currentId = node.parentId;
        }

        return parts.join('/');
    }

    // Get the index of a component within its owner node's _components array
    private getComponentIndex(data: any[], nodeId: number, componentId: number): number {
        if (nodeId === -1) return -1;
        const node = data[nodeId];
        if (!node || !node._components) return -1;
        for (let i = 0; i < node._components.length; i++) {
            if (node._components[i]?.__id__ === componentId) return i;
        }
        return -1;
    }

    // Count the number of cc.Node items in the data array
    private countNodes(data: any[]): number {
        let count = 0;
        for (const item of data) {
            if (item?.__type__ === 'cc.Node') count++;
        }
        return count;
    }

    // Collect all valid UUIDs from assets meta files and engine internal data
    private collectAllUuids(): Set<string> {
        const uuids = new Set<string>();
        const assetsPath = path.join(this.projectPath, 'assets');

        // Collect from all .meta files under assets directory
        this.walkDirectory(assetsPath, (filePath) => {
            if (!filePath.endsWith('.meta')) return;
            try {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                if (content.uuid) {
                    uuids.add(content.uuid);
                }
                if (content.subMetas) {
                    this.collectSubMetaUuids(content.subMetas, uuids);
                }
            } catch (_e) {
                // Skip unparseable meta files
            }
        });

        // Collect from library/.internal-data.json (engine built-in asset UUIDs)
        const internalDataPath = path.join(this.projectPath, 'library', '.internal-data.json');
        try {
            if (fs.existsSync(internalDataPath)) {
                const internalData = JSON.parse(fs.readFileSync(internalDataPath, 'utf-8'));
                for (const uuid of Object.keys(internalData)) {
                    uuids.add(uuid);
                }
            }
        } catch (_e) {
            // Skip if internal data is not available
        }

        return uuids;
    }

    // Recursively collect UUIDs from subMetas objects in .meta files
    private collectSubMetaUuids(subMetas: any, uuids: Set<string>): void {
        for (const value of Object.values(subMetas)) {
            const sub = value as any;
            if (sub?.uuid) {
                uuids.add(sub.uuid);
                // Also add the main part without @hash suffix
                const mainPart = sub.uuid.split('@')[0];
                uuids.add(mainPart);
            }
            if (sub?.subMetas) {
                this.collectSubMetaUuids(sub.subMetas, uuids);
            }
        }
    }

    // Read and parse a JSON file, returning null on failure
    private readJsonFile(filePath: string): any[] | null {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (_e) {
            return null;
        }
    }

    // Recursively walk a directory, invoking callback for each file
    private walkDirectory(dirPath: string, callback: (filePath: string) => void): void {
        if (!fs.existsSync(dirPath)) return;
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                this.walkDirectory(fullPath, callback);
            } else if (entry.isFile()) {
                callback(fullPath);
            }
        }
    }
}
