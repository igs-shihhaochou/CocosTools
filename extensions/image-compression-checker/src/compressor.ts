import * as fs from 'fs';
import * as path from 'path';

/**
 * 支援的壓縮格式
 */
export const COMPRESS_FORMATS = [
    { value: 'webp', label: 'WebP', desc: '通用，H5 推薦' },
    { value: 'etc2', label: 'ETC2', desc: 'Android / WebGL2' },
    { value: 'astc', label: 'ASTC', desc: '高品質，Android / iOS' },
    { value: 'pvrtc', label: 'PVRTC', desc: '舊 iOS 裝置' },
    { value: 'png', label: 'PNG (minify)', desc: '無損壓縮' },
];

/**
 * 壓縮品質選項
 */
export const COMPRESS_QUALITY = [
    { value: 'fast', label: '快速（品質較低）' },
    { value: 'normal', label: '一般' },
    { value: 'best', label: '最佳品質' },
];

/**
 * 批次壓縮設定請求
 */
export interface BatchCompressRequest {
    /** 要設定壓縮的圖片絕對路徑列表 */
    imagePaths: string[];
    /** 壓縮格式 */
    format: string;
    /** 壓縮品質 */
    quality: string;
}

/**
 * 批次壓縮結果
 */
export interface BatchCompressResult {
    success: number;
    failed: number;
    errors: Array<{ path: string; error: string }>;
}

/**
 * 圖片壓縮設定器
 * 負責修改圖片 .meta 檔案中的壓縮設定
 */
export class ImageCompressor {

    /**
     * 批次設定圖片壓縮格式
     * 修改每張圖片的 .meta 檔案，寫入 compressSettings
     */
    static batchSetCompression(request: BatchCompressRequest): BatchCompressResult {
        const result: BatchCompressResult = {
            success: 0,
            failed: 0,
            errors: [],
        };

        for (const imagePath of request.imagePaths) {
            try {
                const success = this.setImageCompression(imagePath, request.format, request.quality);
                if (success) {
                    result.success++;
                } else {
                    result.failed++;
                    result.errors.push({ path: imagePath, error: 'meta 檔案不存在或無法解析' });
                }
            } catch (e: any) {
                result.failed++;
                result.errors.push({ path: imagePath, error: e.message || String(e) });
            }
        }

        return result;
    }

    /**
     * 設定單張圖片的壓縮格式
     * @returns 是否成功
     */
    private static setImageCompression(imagePath: string, format: string, quality: string): boolean {
        const metaPath = imagePath + '.meta';

        if (!fs.existsSync(metaPath)) {
            return false;
        }

        try {
            const metaContent = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

            // 建立壓縮設定
            const compressSettings = this.buildCompressSettings(format, quality);

            // 寫入到 meta 檔案的 userData.compressSettings
            if (!metaContent.userData) {
                metaContent.userData = {};
            }
            metaContent.userData.compressSettings = compressSettings;

            // 同時寫入 subMetas 中的 SpriteFrame（如果有的話）
            if (metaContent.subMetas) {
                for (const key of Object.keys(metaContent.subMetas)) {
                    const subMeta = metaContent.subMetas[key];
                    if (subMeta && subMeta.importer === 'sprite-frame') {
                        if (!subMeta.userData) {
                            subMeta.userData = {};
                        }
                        subMeta.userData.compressSettings = compressSettings;
                    }
                }
            }

            // 寫回 meta 檔案
            fs.writeFileSync(metaPath, JSON.stringify(metaContent, null, 2), 'utf-8');
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 建立 Cocos Creator 3.x 格式的壓縮設定
     */
    private static buildCompressSettings(format: string, quality: string): Record<string, any> {
        // Cocos Creator 3.x 的 compressSettings 格式：
        // { "web": { "format": "webp", "quality": "normal" }, ... }
        const settings: Record<string, any> = {};

        // 根據格式決定適用的平台
        switch (format) {
            case 'webp':
                // WebP 適用 web 和 android
                settings['web'] = { format: 'webp', quality };
                settings['android'] = { format: 'webp', quality };
                break;
            case 'etc2':
                // ETC2 適用 android 和 web (WebGL2)
                settings['web'] = { format: 'etc2', quality };
                settings['android'] = { format: 'etc2', quality };
                break;
            case 'astc':
                // ASTC 適用 android 和 ios
                settings['android'] = { format: 'astc', quality };
                settings['ios'] = { format: 'astc', quality };
                break;
            case 'pvrtc':
                // PVRTC 適用 ios
                settings['ios'] = { format: 'pvrtc', quality };
                break;
            case 'png':
                // PNG minify 適用所有平台
                settings['web'] = { format: 'png', quality };
                settings['android'] = { format: 'png', quality };
                settings['ios'] = { format: 'png', quality };
                break;
            default:
                settings['web'] = { format, quality };
                break;
        }

        return settings;
    }
}
