import * as fs from 'fs';
import * as path from 'path';

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

/** .meta 檔案解析出的 UUID */
interface MetaInfo {
    uuid: string;
    subMetas?: Record<string, { uuid: string; subMetas?: Record<string, { uuid: string }> }>;
}

/** 要排除的目錄名 */
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', 'temp', 'library', 'local', 'profiles', 'extensions']);

/** 掃描目標的資源副檔名 */
const ASSET_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif',  // 圖片
    '.skel', '.atlas',                                    // Spine
    '.mp3', '.ogg', '.wav', '.m4a',                      // 音效
    '.prefab',                                            // 預製體
    '.anim', '.animation',                                // 動畫
    '.mtl', '.effect',                                    // 材質/特效
    '.fnt',                                               // BMFont
    '.json',                                              // JSON 資料
    '.ttf', '.otf',                                       // 字型
    '.plist',                                             // Plist
    '.fbx', '.gltf', '.glb',                             // 3D 模型
]);

/** 引用搜尋目標的檔案副檔名 */
const REFERENCE_EXTENSIONS = new Set([
    '.scene', '.prefab', '.anim', '.animation', '.mtl', '.effect',
    '.ts', '.js',
    '.json', '.pac',
]);

/**
 * 壓縮 UUID（模擬 Cocos Creator 的 compressUuid）
 * Cocos 在序列化檔案中使用 Base64 壓縮格式的 UUID
 */
function compressUuid(uuid: string): string {
    // Cocos compressUuid: 去掉 dash，把 hex 轉成自定義 Base64
    const hex = uuid.replace(/-/g, '');
    if (hex.length !== 32) return uuid;

    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';

    // 每 2 個 hex 字元 = 1 byte，每 3 bytes = 4 base64 字元
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }

    for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i];
        const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;

        result += base64Chars[(b0 >> 2) & 0x3f];
        result += base64Chars[((b0 << 4) | (b1 >> 4)) & 0x3f];
        if (i + 1 < bytes.length) {
            result += base64Chars[((b1 << 2) | (b2 >> 6)) & 0x3f];
        }
        if (i + 2 < bytes.length) {
            result += base64Chars[b2 & 0x3f];
        }
    }

    return result;
}

/**
 * 產生一個 UUID 的所有可能出現格式
 */
function getUuidVariants(uuid: string): string[] {
    const variants: string[] = [uuid];
    const noDash = uuid.replace(/-/g, '');
    if (noDash !== uuid) {
        variants.push(noDash);
    }
    // Cocos 壓縮格式
    const compressed = compressUuid(uuid);
    if (compressed !== uuid && compressed !== noDash) {
        variants.push(compressed);
    }
    // 有些引用只取前 5 個字元做短引用（Cocos 的 short uuid）
    // 不過這樣會誤判太多，先不加

    return variants;
}

export class UnusedResourceScanner {
    private projectPath: string;
    private scanPath: string;
    private assetsPath: string;

    constructor(projectPath: string, scanPath: string) {
        this.projectPath = projectPath;
        this.scanPath = scanPath;
        this.assetsPath = path.join(projectPath, 'assets');
    }

    async scan(): Promise<ScanResult> {
        const startTime = Date.now();

        // 1. 收集掃描資料夾下所有資源的 UUID
        const targetAssets = this.collectTargetAssets();

        if (targetAssets.length === 0) {
            return {
                scanFolder: this.scanPath,
                scanFolderUrl: this.pathToDbUrl(this.scanPath),
                totalAssets: 0,
                unusedAssets: [],
                elapsed: Date.now() - startTime,
            };
        }

        // 2. 建立 UUID Set 用於快速查詢
        const targetUuids = new Map<string, UnusedAssetInfo>();
        for (const asset of targetAssets) {
            targetUuids.set(asset.uuid, asset);
        }

        // 3. 掃描整個專案找出哪些 UUID 被引用
        const referencedUuids = this.findReferencedUuids(targetUuids, this.scanPath);

        // 3.5 額外檢查 Spine 的 atlasUuid 引用關係
        this.findSpineAtlasReferences(targetUuids, referencedUuids);

        // 3.6 額外檢查 BMFont 的 textureUuid 引用關係
        this.findBitmapFontReferences(targetUuids, referencedUuids);

        // 4. 以「檔案」為單位判斷是否未使用
        // 一個檔案只要有任何一個相關 UUID 被引用，整個檔案就算「有被使用」
        const referencedFiles = new Set<string>();
        for (const [uuid, asset] of targetUuids) {
            if (referencedUuids.has(uuid)) {
                referencedFiles.add(asset.filePath);
            }
        }

        // 收集未被引用的檔案（去重，每個檔案只出現一次）
        const unusedAssets: UnusedAssetInfo[] = [];
        const seenFiles = new Set<string>();
        for (const [, asset] of targetUuids) {
            if (seenFiles.has(asset.filePath)) continue;
            seenFiles.add(asset.filePath);
            if (!referencedFiles.has(asset.filePath)) {
                unusedAssets.push(asset);
            }
        }

        // 按檔案大小降序排序
        unusedAssets.sort((a, b) => b.fileSize - a.fileSize);

        return {
            scanFolder: this.scanPath,
            scanFolderUrl: this.pathToDbUrl(this.scanPath),
            totalAssets: targetAssets.length,
            unusedAssets,
            elapsed: Date.now() - startTime,
        };
    }

    /**
     * 收集掃描目標資料夾下的所有資源（讀取 .meta 取得 UUID）
     */
    private collectTargetAssets(): UnusedAssetInfo[] {
        const assets: UnusedAssetInfo[] = [];
        this.walkDir(this.scanPath, (filePath) => {
            const ext = path.extname(filePath).toLowerCase();
            if (!ASSET_EXTENSIONS.has(ext)) return;

            const metaPath = filePath + '.meta';
            if (!fs.existsSync(metaPath)) return;

            try {
                const metaContent = fs.readFileSync(metaPath, 'utf-8');
                const meta = JSON.parse(metaContent);
                const uuid = meta.uuid;
                if (!uuid) return;

                const stat = fs.statSync(filePath);
                assets.push({
                    filePath,
                    dbUrl: this.pathToDbUrl(filePath),
                    uuid,
                    fileSize: stat.size,
                    extension: ext,
                });

                // 遞迴收集 subMetas 的 UUID（如 SpriteFrame、Atlas 內的子資源）
                this.collectSubMetaUuids(meta.subMetas, filePath, stat.size, ext, assets);
            } catch {
                // 忽略解析失敗的 meta
            }
        });
        return assets;
    }

    /**
     * 遞迴解析 subMetas 中的所有 UUID
     */
    private collectSubMetaUuids(
        subMetas: any,
        filePath: string,
        fileSize: number,
        extension: string,
        assets: UnusedAssetInfo[]
    ) {
        if (!subMetas || typeof subMetas !== 'object') return;

        for (const [, sub] of Object.entries(subMetas) as [string, any][]) {
            if (sub && sub.uuid) {
                assets.push({
                    filePath,
                    dbUrl: this.pathToDbUrl(filePath),
                    uuid: sub.uuid,
                    fileSize,
                    extension,
                });
            }
            // 遞迴處理巢狀 subMetas
            if (sub && sub.subMetas) {
                this.collectSubMetaUuids(sub.subMetas, filePath, fileSize, extension, assets);
            }
        }
    }

    /**
     * 掃描 assets 資料夾，找出引用了目標 UUID 的情況
     * 注意：不排除任何檔案，因為 prefab/scene/anim 等同時可以是資源也是引用來源
     */
    private findReferencedUuids(
        targetUuids: Map<string, UnusedAssetInfo>,
        _excludePath: string
    ): Set<string> {
        const referenced = new Set<string>();
        const uuidStrings = Array.from(targetUuids.keys());

        // 建立所有 UUID 變體的反查表：variant -> original uuid
        const variantToUuid = new Map<string, string>();
        for (const uuid of uuidStrings) {
            const variants = getUuidVariants(uuid);
            for (const v of variants) {
                variantToUuid.set(v, uuid);
            }
        }

        // 收集所有需要搜索的變體字串
        const allVariants = Array.from(variantToUuid.keys());

        // 建立每個目標資源自己擁有的 UUID 集合（用 filePath 分組）
        const fileOwnedUuids = new Map<string, Set<string>>();
        for (const [uuid, asset] of targetUuids) {
            if (!fileOwnedUuids.has(asset.filePath)) {
                fileOwnedUuids.set(asset.filePath, new Set());
            }
            fileOwnedUuids.get(asset.filePath)!.add(uuid);
        }

        this.walkDir(this.assetsPath, (filePath) => {
            const ext = path.extname(filePath).toLowerCase();
            if (!REFERENCE_EXTENSIONS.has(ext)) return;

            try {
                const content = fs.readFileSync(filePath, 'utf-8');

                // 此檔案自己擁有的 UUID（不能自己引用自己算數）
                const ownUuids = fileOwnedUuids.get(filePath);

                for (const variant of allVariants) {
                    const originalUuid = variantToUuid.get(variant)!;
                    if (referenced.has(originalUuid)) continue;
                    // 跳過自己引用自己的情況
                    if (ownUuids && ownUuids.has(originalUuid)) continue;
                    if (content.includes(variant)) {
                        referenced.add(originalUuid);
                    }
                }
            } catch {
                // 忽略讀取失敗的檔案
            }
        }, true);

        return referenced;
    }

    /**
     * 檢查 Spine 的引用鏈：spine-data → atlas → png
     * 如果 spine data 被使用（UUID 被引用），則它關聯的 atlas 和 png 也算被使用
     * 同時也處理反向：如果目標中有 atlas/png，找出它是否被某個被使用的 spine 引用
     */
    private findSpineAtlasReferences(
        targetUuids: Map<string, UnusedAssetInfo>,
        referencedUuids: Set<string>
    ): void {
        // 收集目標中所有圖片的 filePath -> UUIDs
        const imagePathToUuids = new Map<string, string[]>();
        for (const [uuid, asset] of targetUuids) {
            if (['.png', '.jpg', '.jpeg', '.webp'].includes(asset.extension)) {
                if (!imagePathToUuids.has(asset.filePath)) {
                    imagePathToUuids.set(asset.filePath, []);
                }
                imagePathToUuids.get(asset.filePath)!.push(uuid);
            }
        }

        // 收集目標中所有 atlas 的 UUID -> filePath
        const atlasUuidToPath = new Map<string, string>();
        for (const [uuid, asset] of targetUuids) {
            if (asset.extension === '.atlas') {
                atlasUuidToPath.set(uuid, asset.filePath);
            }
        }

        // 收集目標中所有 atlas 的 filePath -> UUIDs
        const atlasPathToUuids = new Map<string, string[]>();
        for (const [uuid, asset] of targetUuids) {
            if (asset.extension === '.atlas') {
                if (!atlasPathToUuids.has(asset.filePath)) {
                    atlasPathToUuids.set(asset.filePath, []);
                }
                atlasPathToUuids.get(asset.filePath)!.push(uuid);
            }
        }

        // 遍歷所有 spine-data meta，建立 atlas 引用關係
        // 同時收集所有 spine-data 的 UUID，用於判斷 spine 是否被引用
        const spineToAtlasUuid = new Map<string, string>(); // spine UUID -> atlasUuid
        this.walkDir(this.assetsPath, (filePath) => {
            if (!filePath.endsWith('.meta')) return;

            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                if (!content.includes('spine-data')) return;

                const meta = JSON.parse(content);
                if (meta?.importer !== 'spine-data') return;

                const atlasUuid = meta?.userData?.atlasUuid;
                if (atlasUuid && meta.uuid) {
                    spineToAtlasUuid.set(meta.uuid, atlasUuid);
                }
            } catch {
                // 忽略
            }
        });

        // 標記：如果 spine-data 被引用，則其 atlas 和 atlas 引用的 png 都算被引用
        for (const [spineUuid, atlasUuid] of spineToAtlasUuid) {
            // spine 被引用的條件：它的 UUID 在 referencedUuids 中，或者它不在目標中（代表它是外部檔案）
            const spineIsReferenced = referencedUuids.has(spineUuid) || !targetUuids.has(spineUuid);

            if (!spineIsReferenced) continue;

            // 標記 atlas 為已使用
            if (atlasUuidToPath.has(atlasUuid)) {
                referencedUuids.add(atlasUuid);

                // 解析 atlas 內容，標記引用的 png
                const atlasPath = atlasUuidToPath.get(atlasUuid)!;
                this.markAtlasImages(atlasPath, imagePathToUuids, referencedUuids);
            }
        }

        // 額外處理：即使 atlas 不在目標中，如果目標中的 png 跟某個 atlas 在同一目錄
        // 且該 atlas 被某個已被使用的 spine 引用，也要標記 png
        // 遍歷所有 atlas 檔案（不限於目標中的）
        for (const [spineUuid, atlasUuid] of spineToAtlasUuid) {
            const spineIsReferenced = referencedUuids.has(spineUuid) || !targetUuids.has(spineUuid);
            if (!spineIsReferenced) continue;

            // 找到 atlas 的實際路徑（可能不在目標中）
            let atlasPath = atlasUuidToPath.get(atlasUuid);
            if (!atlasPath) {
                // atlas 不在目標中，需要從 meta 檔反查
                atlasPath = this.findAtlasPathByUuid(atlasUuid);
            }
            if (!atlasPath) continue;

            this.markAtlasImages(atlasPath, imagePathToUuids, referencedUuids);
        }
    }

    /**
     * 檢查 BMFont 的引用鏈：fnt → png (textureUuid)
     * 如果 .fnt 被使用，則它關聯的 png（textureUuid）也算被使用
     */
    private findBitmapFontReferences(
        targetUuids: Map<string, UnusedAssetInfo>,
        referencedUuids: Set<string>
    ): void {
        // 收集目標中所有圖片的 UUID -> filePath（用於反查）
        const imageUuidToPath = new Map<string, string>();
        for (const [uuid, asset] of targetUuids) {
            if (['.png', '.jpg', '.jpeg', '.webp'].includes(asset.extension)) {
                imageUuidToPath.set(uuid, asset.filePath);
            }
        }

        // 遍歷所有 .fnt.meta，找出 textureUuid 關係
        this.walkDir(this.assetsPath, (filePath) => {
            if (!filePath.endsWith('.fnt.meta')) return;

            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const meta = JSON.parse(content);
                const fntUuid = meta?.uuid;
                const textureUuid = meta?.userData?.textureUuid;

                if (!fntUuid || !textureUuid) return;

                // 如果這個 fnt 被引用了（或不在目標中），則它的 textureUuid 對應的 png 也算被使用
                const fntIsReferenced = referencedUuids.has(fntUuid) || !targetUuids.has(fntUuid);
                if (fntIsReferenced && imageUuidToPath.has(textureUuid)) {
                    referencedUuids.add(textureUuid);
                }
            } catch {
                // 忽略
            }
        });
    }

    /**
     * 解析 atlas 檔案，標記它引用的圖片為已使用
     */
    private markAtlasImages(
        atlasPath: string,
        imagePathToUuids: Map<string, string[]>,
        referencedUuids: Set<string>
    ): void {
        try {
            const atlasContent = fs.readFileSync(atlasPath, 'utf-8');
            const atlasDir = path.dirname(atlasPath);

            const lines = atlasContent.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (/\.(png|jpg|jpeg|webp)$/i.test(trimmed)) {
                    const imgPath = path.join(atlasDir, trimmed);
                    const imgUuids = imagePathToUuids.get(imgPath);
                    if (imgUuids) {
                        for (const uuid of imgUuids) {
                            referencedUuids.add(uuid);
                        }
                    }
                }
            }
        } catch {
            // 忽略
        }
    }

    /**
     * 透過 UUID 反查 atlas 的實際檔案路徑
     */
    private findAtlasPathByUuid(atlasUuid: string): string | undefined {
        let result: string | undefined;
        this.walkDir(this.assetsPath, (filePath) => {
            if (result) return;
            if (!filePath.endsWith('.atlas.meta')) return;
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const meta = JSON.parse(content);
                if (meta.uuid === atlasUuid) {
                    result = filePath.replace(/\.meta$/, '');
                }
            } catch {
                // 忽略
            }
        });
        return result;
    }

    /**
     * 遞迴遍歷目錄
     */
    private walkDir(dir: string, callback: (filePath: string) => void, skipMeta: boolean = false) {
        if (!fs.existsSync(dir)) return;

        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (EXCLUDED_DIRS.has(entry.name)) continue;

            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                this.walkDir(fullPath, callback, skipMeta);
            } else if (entry.isFile()) {
                if (skipMeta && entry.name.endsWith('.meta')) continue;
                callback(fullPath);
            }
        }
    }

    /**
     * 將絕對路徑轉為 db:// URL
     */
    private pathToDbUrl(filePath: string): string {
        const relative = path.relative(this.assetsPath, filePath);
        if (relative.startsWith('..')) return filePath;
        return 'db://assets/' + relative.replace(/\\/g, '/');
    }
}
