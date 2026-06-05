import { ScanReport, ImageScanResult, CompressionCategory } from './types';

/**
 * 報告產生器
 * 將掃描結果格式化為可讀的文字報告或結構化資料
 */
export class ReportGenerator {

    /**
     * 產生 Console 文字報告
     */
    static generateConsoleReport(report: ScanReport): string {
        const lines: string[] = [];
        const divider = '═'.repeat(70);
        const thinDivider = '─'.repeat(70);

        lines.push('');
        lines.push(divider);
        lines.push('  📊 圖片壓縮檢查報告');
        lines.push(divider);
        lines.push(`  掃描時間: ${report.scanTime}`);
        lines.push(`  掃描耗時: ${report.duration}ms`);
        lines.push(`  專案路徑: ${report.projectPath}`);
        lines.push('');

        // 統計摘要
        lines.push(thinDivider);
        lines.push('  📈 統計摘要');
        lines.push(thinDivider);
        lines.push(`  圖片總數: ${report.summary.totalImages}`);
        lines.push(`  總大小:   ${report.summary.totalSizeFormatted}`);
        lines.push('');
        lines.push(`  ⚠️  散圖未壓縮: ${report.summary.looseUncompressedCount} 張 (${formatSize(report.summary.looseUncompressedSize)})`);
        lines.push(`  ⚠️  圖集未壓縮: ${report.summary.atlasUncompressedCount} 張 (${formatSize(report.summary.atlasUncompressedSize)})`);
        lines.push(`  ✅ 散圖已壓縮: ${report.summary.looseCompressedCount} 張 (${formatSize(report.summary.looseCompressedSize)})`);
        lines.push(`  ✅ 圖集已壓縮: ${report.summary.atlasCompressedCount} 張 (${formatSize(report.summary.atlasCompressedSize)})`);
        lines.push('');
        lines.push(`  📦 未入圖集的散圖: ${report.summary.notInAtlasCount} 張`);
        lines.push(`  💰 預估可節省空間: ${report.summary.totalEstimatedSavingFormatted}`);
        lines.push('');

        // 圖集資訊
        if (report.atlases.length > 0) {
            lines.push(thinDivider);
            lines.push('  📁 專案圖集');
            lines.push(thinDivider);
            for (const atlas of report.atlases) {
                const status = atlas.hasCompression ? '✅ 已壓縮' : '⚠️ 未壓縮';
                const formats = atlas.compressionFormats.length > 0
                    ? `[${atlas.compressionFormats.join(', ')}]`
                    : '';
                lines.push(`  ${status} ${atlas.path} ${formats}`);
            }
            lines.push('');
        }

        // 分類一：散圖未壓縮（最高優先）
        if (report.categories.looseUncompressed.length > 0) {
            lines.push(divider);
            lines.push('  ⚠️  分類一：散圖未壓縮（未入圖集 + 未壓縮）— 最高優先');
            lines.push(divider);
            this.appendImageList(lines, report.categories.looseUncompressed);
        }

        // 分類二：圖集未壓縮
        if (report.categories.atlasUncompressed.length > 0) {
            lines.push(divider);
            lines.push('  ⚠️  分類二：圖集未壓縮（已入圖集但圖集未設定壓縮）');
            lines.push(divider);
            this.appendImageList(lines, report.categories.atlasUncompressed);
        }

        // 分類三：散圖已壓縮
        if (report.categories.looseCompressed.length > 0) {
            lines.push(divider);
            lines.push('  💡 分類三：散圖已壓縮（未入圖集但已單獨壓縮）');
            lines.push(divider);
            this.appendImageList(lines, report.categories.looseCompressed, true);
        }

        // 分類四：圖集已壓縮
        if (report.categories.atlasCompressed.length > 0) {
            lines.push(divider);
            lines.push('  ✅ 分類四：圖集已壓縮（已入圖集且圖集已壓縮）');
            lines.push(divider);
            lines.push(`  共 ${report.categories.atlasCompressed.length} 張，狀態良好`);
            lines.push('');
        }

        lines.push(divider);
        lines.push('  報告結束');
        lines.push(divider);
        lines.push('');

        return lines.join('\n');
    }

    /**
     * 產生按資料夾分組的報告
     */
    static generateGroupedByFolderReport(report: ScanReport): string {
        const lines: string[] = [];
        const groups = new Map<string, ImageScanResult[]>();

        for (const result of report.allResults) {
            const folder = result.relativePath.split('/').slice(0, -1).join('/');
            if (!groups.has(folder)) {
                groups.set(folder, []);
            }
            groups.get(folder)!.push(result);
        }

        lines.push('');
        lines.push('📂 按資料夾分組');
        lines.push('─'.repeat(70));

        for (const [folder, images] of groups) {
            const totalSize = images.reduce((sum, img) => sum + img.fileSize, 0);
            const uncompressedCount = images.filter(img =>
                img.category === CompressionCategory.LOOSE_UNCOMPRESSED ||
                img.category === CompressionCategory.ATLAS_UNCOMPRESSED
            ).length;

            lines.push(`\n  📁 ${folder || '(root)'}`);
            lines.push(`     圖片數: ${images.length} | 總大小: ${formatSize(totalSize)} | 未壓縮: ${uncompressedCount}`);

            for (const img of images) {
                const icon = this.getCategoryIcon(img.category);
                const filename = img.relativePath.split('/').pop();
                lines.push(`     ${icon} ${filename} (${formatSize(img.fileSize)})`);
            }
        }

        return lines.join('\n');
    }

    /**
     * 產生按圖集歸屬分組的報告
     */
    static generateGroupedByAtlasReport(report: ScanReport): string {
        const lines: string[] = [];
        const atlasGroups = new Map<string, ImageScanResult[]>();
        const noAtlas: ImageScanResult[] = [];

        for (const result of report.allResults) {
            if (result.atlasNames.length === 0) {
                noAtlas.push(result);
            } else {
                for (const atlasName of result.atlasNames) {
                    if (!atlasGroups.has(atlasName)) {
                        atlasGroups.set(atlasName, []);
                    }
                    atlasGroups.get(atlasName)!.push(result);
                }
            }
        }

        lines.push('');
        lines.push('📦 按圖集歸屬分組');
        lines.push('─'.repeat(70));

        // 已歸屬圖集的
        for (const [atlasName, images] of atlasGroups) {
            const atlas = report.atlases.find(a => a.path === atlasName);
            const status = atlas?.hasCompression ? '✅' : '⚠️';
            lines.push(`\n  ${status} 圖集: ${atlasName}`);
            lines.push(`     包含 ${images.length} 張圖片`);
        }

        // 未歸屬圖集的
        if (noAtlas.length > 0) {
            lines.push(`\n  ⚠️ 未入圖集的散圖: ${noAtlas.length} 張`);
            for (const img of noAtlas.slice(0, 20)) { // 最多顯示 20 張
                const icon = img.hasCompression ? '✅' : '⚠️';
                lines.push(`     ${icon} ${img.relativePath} (${formatSize(img.fileSize)})`);
            }
            if (noAtlas.length > 20) {
                lines.push(`     ... 以及另外 ${noAtlas.length - 20} 張`);
            }
        }

        return lines.join('\n');
    }

    /**
     * 篩選報告：只顯示超過閾值的圖片
     */
    static filterBySize(report: ScanReport, threshold: number): ImageScanResult[] {
        return report.allResults.filter(r => r.fileSize >= threshold);
    }

    /**
     * 篩選報告：只顯示特定分類
     */
    static filterByCategory(report: ScanReport, category: CompressionCategory): ImageScanResult[] {
        return report.allResults.filter(r => r.category === category);
    }

    /**
     * 匯出為 JSON
     */
    static exportToJSON(report: ScanReport): string {
        return JSON.stringify(report, null, 2);
    }

    // ─── Private Helpers ───────────────────────────────────────────────

    private static appendImageList(
        lines: string[],
        images: ImageScanResult[],
        compact: boolean = false
    ): void {
        const displayImages = compact ? images.slice(0, 10) : images;

        for (const img of displayImages) {
            const dims = img.width > 0 ? `${img.width}x${img.height}` : '?x?';
            lines.push(`  📄 ${img.relativePath}`);
            lines.push(`     大小: ${formatSize(img.fileSize)} | 尺寸: ${dims} | 格式: ${img.format.toUpperCase()}`);

            if (img.atlasNames.length > 0) {
                lines.push(`     圖集: ${img.atlasNames.join(', ')}`);
            }

            if (img.estimatedSaving > 0) {
                lines.push(`     預估節省: ${formatSize(img.estimatedSaving)}`);
            }

            lines.push(`     ${img.suggestion}`);
            lines.push('');
        }

        if (compact && images.length > 10) {
            lines.push(`  ... 以及另外 ${images.length - 10} 張`);
            lines.push('');
        }
    }

    private static getCategoryIcon(category: CompressionCategory): string {
        switch (category) {
            case CompressionCategory.LOOSE_UNCOMPRESSED: return '🔴';
            case CompressionCategory.ATLAS_UNCOMPRESSED: return '🟡';
            case CompressionCategory.LOOSE_COMPRESSED: return '🔵';
            case CompressionCategory.ATLAS_COMPRESSED: return '🟢';
            default: return '⚪';
        }
    }
}

/**
 * 格式化檔案大小
 */
function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(2);
    return `${size} ${units[i]}`;
}
