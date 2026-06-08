import * as fs from 'fs';
import * as path from 'path';

/**
 * 批次壓縮設定請求
 */
export interface BatchCompressRequest {
    /** 要設定壓縮的圖片絕對路徑列表 */
    imagePaths: string[];
    /** Preset ID（從專案設定中選擇） */
    presetId: string;
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
     * 批次設定圖片壓縮 Preset
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
                const success = this.setImageCompression(imagePath, request.presetId);
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
     * 設定單張圖片的壓縮 Preset
     * @returns 是否成功
     */
    private static setImageCompression(imagePath: string, presetId: string): boolean {
        const metaPath = imagePath + '.meta';

        if (!fs.existsSync(metaPath)) {
            return false;
        }

        try {
            const metaContent = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

            // 寫入 compressSettings
            if (!metaContent.userData) {
                metaContent.userData = {};
            }
            metaContent.userData.compressSettings = {
                useCompressTexture: true,
                presetId: presetId,
            };

            // 寫回 meta 檔案
            fs.writeFileSync(metaPath, JSON.stringify(metaContent, null, 2), 'utf-8');
            return true;
        } catch (e) {
            return false;
        }
    }
}
