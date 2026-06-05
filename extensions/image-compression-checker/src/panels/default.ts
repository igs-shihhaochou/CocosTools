// @ts-nocheck
/**
 * 圖片壓縮檢查面板
 * 提供完整的掃描結果展示、批次勾選、壓縮格式設定功能
 *
 * 注意：此檔案在 Cocos Creator 面板環境中執行，
 * `this.$`、`this._report` 等由面板框架注入，TypeScript 無法靜態推斷。
 */

const panelTemplate = `
<style>
    :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12px;
        color: #ccc;
        background: #252526;
    }

    .toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #1e1e1e;
        border-bottom: 1px solid #3c3c3c;
        flex-wrap: wrap;
    }

    .toolbar button {
        padding: 4px 12px;
        background: #0e639c;
        color: #fff;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    }

    .toolbar button:hover {
        background: #1177bb;
    }

    .toolbar button:disabled {
        background: #555;
        cursor: not-allowed;
    }

    .toolbar select {
        padding: 4px 8px;
        background: #3c3c3c;
        color: #ccc;
        border: 1px solid #555;
        border-radius: 3px;
        font-size: 12px;
    }

    .toolbar label {
        color: #999;
        font-size: 11px;
    }

    .toolbar .separator {
        width: 1px;
        height: 20px;
        background: #555;
        margin: 0 4px;
    }

    .summary {
        display: flex;
        gap: 16px;
        padding: 8px 12px;
        background: #2d2d30;
        border-bottom: 1px solid #3c3c3c;
        flex-wrap: wrap;
    }

    .summary-item {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .summary-item .value {
        font-weight: bold;
        color: #fff;
    }

    .summary-item.warn .value {
        color: #f0ad4e;
    }

    .summary-item.good .value {
        color: #5cb85c;
    }

    .table-container {
        flex: 1;
        overflow: auto;
        padding: 0;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
    }

    thead {
        position: sticky;
        top: 0;
        z-index: 1;
    }

    th {
        background: #333;
        padding: 6px 8px;
        text-align: left;
        border-bottom: 1px solid #555;
        white-space: nowrap;
        user-select: none;
        cursor: pointer;
    }

    th:hover {
        background: #3c3c3c;
    }

    td {
        padding: 5px 8px;
        border-bottom: 1px solid #2d2d30;
        vertical-align: middle;
    }

    tr:hover td {
        background: #2a2d2e;
    }

    .checkbox-cell {
        width: 30px;
        text-align: center;
    }

    .checkbox-cell input[type="checkbox"] {
        cursor: pointer;
    }

    .status-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
    }

    .status-badge.loose-uncompressed {
        background: #5c2020;
        color: #f48771;
    }

    .status-badge.atlas-uncompressed {
        background: #5c4b20;
        color: #f0ad4e;
    }

    .status-badge.atlas-invalid-preset {
        background: #5c3a10;
        color: #ff8c00;
    }

    .status-badge.loose-compressed {
        background: #1e3a5f;
        color: #6cb6ff;
    }

    .status-badge.atlas-compressed {
        background: #1e3f1e;
        color: #5cb85c;
    }

    .path-cell {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
        color: #4fc1ff;
    }

    .path-cell:hover {
        text-decoration: underline;
    }

    .size-cell {
        white-space: nowrap;
        text-align: right;
    }

    .size-large {
        color: #f48771;
        font-weight: bold;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
    }

    .empty-state .icon {
        font-size: 48px;
        margin-bottom: 12px;
    }

    .batch-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #1e3a5f;
        border-top: 1px solid #3c3c3c;
    }

    .batch-bar .count {
        color: #6cb6ff;
        font-weight: bold;
    }

    .scan-folder-info {
        padding: 2px 8px;
        background: #3c3c3c;
        border-radius: 3px;
        color: #6cb6ff;
        font-size: 11px;
    }
</style>

<div class="toolbar">
    <button id="scanBtn">🔍 掃描專案</button>
    <div class="separator"></div>
    <label>篩選:</label>
    <select id="filterCategory">
        <option value="need_action" selected>需處理</option>
        <option value="all">全部</option>
        <option value="loose_uncompressed">🔴 散圖未壓縮</option>
        <option value="atlas_uncompressed">🟡 圖集未壓縮</option>
        <option value="atlas_invalid_preset">🟠 圖集 Preset 無效</option>
        <option value="loose_compressed">🔵 散圖已壓縮（未入圖集）</option>
        <option value="atlas_compressed">🟢 圖集已壓縮（正常）</option>
    </select>
    <label>大小閾值:</label>
    <select id="filterSize">
        <option value="0">不限</option>
        <option value="10240">≥ 10KB</option>
        <option value="51200">≥ 50KB</option>
        <option value="102400" selected>≥ 100KB</option>
        <option value="512000">≥ 500KB</option>
        <option value="1048576">≥ 1MB</option>
    </select>
    <span id="scanFolderInfo" class="scan-folder-info" style="display:none;"></span>
</div>

<div class="summary" id="summaryBar" style="display:none;">
    <div class="summary-item">
        <span>📷 圖片:</span>
        <span class="value" id="totalCount">0</span>
    </div>
    <div class="summary-item">
        <span>💾 總大小:</span>
        <span class="value" id="totalSize">0</span>
    </div>
    <div class="summary-item warn">
        <span>⚠️ 未壓縮:</span>
        <span class="value" id="uncompressedCount">0</span>
    </div>
    <div class="summary-item">
        <span>📦 未入圖集:</span>
        <span class="value" id="notInAtlasCount">0</span>
    </div>
    <div class="summary-item good">
        <span>💰 可節省:</span>
        <span class="value" id="estimatedSaving">0</span>
    </div>
</div>

<div class="table-container" id="tableContainer">
    <div class="empty-state" id="emptyState">
        <div class="icon">🖼️</div>
        <p>點擊「掃描專案」或右鍵資料夾開始檢查圖片壓縮狀態</p>
    </div>
    <table id="resultTable" style="display:none;">
        <thead>
            <tr>
                <th class="checkbox-cell"><input type="checkbox" id="selectAll" title="全選/取消全選"></th>
                <th>路徑</th>
                <th>大小 ↓</th>
                <th>尺寸</th>
                <th>格式</th>
                <th>狀態</th>
                <th>圖集</th>
                <th>建議</th>
            </tr>
        </thead>
        <tbody id="tableBody">
        </tbody>
    </table>
</div>

<div class="batch-bar" id="batchBar" style="display:none;">
    <span>已選擇 <span class="count" id="selectedCount">0</span> 張圖片</span>
    <div class="separator"></div>
    <label>壓縮格式:</label>
    <select id="compressFormat">
        <option value="webp">WebP（H5 推薦）</option>
        <option value="etc2">ETC2（Android/WebGL2）</option>
        <option value="astc">ASTC（高品質）</option>
        <option value="pvrtc">PVRTC（舊 iOS）</option>
        <option value="png">PNG（無損壓縮）</option>
    </select>
    <label>品質:</label>
    <select id="compressQuality">
        <option value="fast">快速</option>
        <option value="normal" selected>一般</option>
        <option value="best">最佳</option>
    </select>
    <button id="applyCompressBtn">✅ 套用壓縮設定</button>
</div>
`;

module.exports = Editor.Panel.define({
    template: panelTemplate,
    $: {
        scanBtn: '#scanBtn',
        filterCategory: '#filterCategory',
        filterSize: '#filterSize',
        scanFolderInfo: '#scanFolderInfo',
        summaryBar: '#summaryBar',
        totalCount: '#totalCount',
        totalSize: '#totalSize',
        uncompressedCount: '#uncompressedCount',
        notInAtlasCount: '#notInAtlasCount',
        estimatedSaving: '#estimatedSaving',
        tableContainer: '#tableContainer',
        emptyState: '#emptyState',
        resultTable: '#resultTable',
        tableBody: '#tableBody',
        selectAll: '#selectAll',
        batchBar: '#batchBar',
        selectedCount: '#selectedCount',
        compressFormat: '#compressFormat',
        compressQuality: '#compressQuality',
        applyCompressBtn: '#applyCompressBtn',
    },

    ready() {
        // 初始化狀態
        this._report = null;
        this._filteredResults = [];
        this._selectedPaths = new Set();
        this._scanFolder = '';
        this._lastScanVersion = 0;
        this._pollTimer = null;

        this._bindEvents();

        // 面板開啟後，檢查主進程是否有指定的掃描資料夾
        this._checkPendingScanFolder();

        // 啟動輪詢，每 500ms 檢查是否有新的掃描指令
        this._startPolling();
    },

    close() {
        this._report = null;
        this._filteredResults = [];
        this._selectedPaths = null;
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    },

    methods: {
        /**
         * 接收主進程通知：掃描新的資料夾（面板已開啟時觸發）
         */
        onNotifyScan(folderUrl) {
            if (!folderUrl) return;
            this._scanFolder = folderUrl;
            const info = this.$.scanFolderInfo;
            info.textContent = `📁 ${folderUrl}`;
            info.style.display = 'inline-block';
            this._doScan();
        },

        /**
         * 啟動輪詢，定期檢查主進程是否有新的掃描指令
         */
        _startPolling() {
            this._pollTimer = setInterval(async () => {
                try {
                    const result = await Editor.Message.request(
                        'image-compression-checker',
                        'getPendingScanFolder'
                    );
                    if (result && result.version > this._lastScanVersion && result.folder) {
                        this._lastScanVersion = result.version;
                        this._scanFolder = result.folder;
                        const info = this.$.scanFolderInfo;
                        info.textContent = `📁 ${result.folder}`;
                        info.style.display = 'inline-block';
                        this._doScan();
                    }
                } catch (e) {
                    // 靜默
                }
            }, 500);
        },

        /**
         * 面板初始化時檢查是否有待掃描的資料夾
         */
        async _checkPendingScanFolder() {
            try {
                const result = await Editor.Message.request(
                    'image-compression-checker',
                    'getPendingScanFolder'
                );
                if (result && result.folder && result.version > 0) {
                    this._lastScanVersion = result.version;
                    this._scanFolder = result.folder;
                    const info = this.$.scanFolderInfo;
                    info.textContent = `📁 ${result.folder}`;
                    info.style.display = 'inline-block';
                    this._doScan();
                }
            } catch (e) {
                // 靜默處理
            }
        },

        _bindEvents() {
            this.$.scanBtn.addEventListener('click', () => this._doScan());
            this.$.filterCategory.addEventListener('change', () => this._applyFilters());
            this.$.filterSize.addEventListener('change', () => this._applyFilters());
            this.$.selectAll.addEventListener('change', () => this._toggleSelectAll());
            this.$.applyCompressBtn.addEventListener('click', () => this._applyCompression());
        },

        async _doScan() {
            const scanBtn = this.$.scanBtn;
            scanBtn.disabled = true;
            scanBtn.textContent = '⏳ 掃描中...';

            try {
                const options = {
                    minFileSize: 0,
                    largeFileThreshold: 100 * 1024,
                };

                if (this._scanFolder) {
                    options.scanFolder = this._scanFolder;
                }

                const report = await Editor.Message.request(
                    'image-compression-checker',
                    'scanForPanel',
                    options
                );

                if (report) {
                    this._report = report;
                    this._selectedPaths.clear();
                    this._updateSummary();
                    this._applyFilters();
                    this.$.emptyState.style.display = 'none';
                    this.$.resultTable.style.display = 'table';
                    this.$.summaryBar.style.display = 'flex';
                }
            } catch (e) {
                console.error('[ImageCompressionChecker Panel]', e);
            } finally {
                scanBtn.disabled = false;
                scanBtn.textContent = '🔍 掃描專案';
            }
        },

        _updateSummary() {
            const report = this._report;
            if (!report) return;

            this.$.totalCount.textContent = String(report.summary.totalImages);
            this.$.totalSize.textContent = report.summary.totalSizeFormatted;
            this.$.uncompressedCount.textContent =
                String(report.summary.looseUncompressedCount + report.summary.atlasUncompressedCount);
            this.$.notInAtlasCount.textContent = String(report.summary.notInAtlasCount);
            this.$.estimatedSaving.textContent = report.summary.totalEstimatedSavingFormatted;
        },

        _applyFilters() {
            if (!this._report) return;

            const categoryFilter = this.$.filterCategory.value;
            const sizeFilter = parseInt(this.$.filterSize.value, 10);

            let results = this._report.allResults;

            // 篩選分類
            if (categoryFilter === 'need_action') {
                // 需處理：排除已壓縮的圖集和字型圖片
                results = results.filter((r) => r.category !== 'atlas_compressed');
            } else if (categoryFilter === 'all') {
                // 全部：不篩選，列出所有
            } else {
                results = results.filter((r) => r.category === categoryFilter);
            }

            // 篩選大小
            if (sizeFilter > 0) {
                results = results.filter((r) => r.fileSize >= sizeFilter);
            }

            this._filteredResults = results;
            this._renderTable();
        },

        _renderTable() {
            const tbody = this.$.tableBody;
            const rows = [];

            for (const item of this._filteredResults) {
                const checked = this._selectedPaths.has(item.absolutePath) ? 'checked' : '';
                const dims = item.width > 0 ? `${item.width}×${item.height}` : '?';
                const sizeClass = item.fileSize >= 102400 ? 'size-large' : '';
                const statusClass = item.category.replace(/_/g, '-');
                const statusLabel = this._getCategoryLabel(item.category);
                const atlasText = item.atlasNames.length > 0
                    ? item.atlasNames.map((a) => a.split('/').pop()).join(', ')
                    : '<span style="color:#666;">—</span>';
                const suggestion = this._getShortSuggestion(item.category);

                rows.push(`
                    <tr data-path="${this._escapeHtml(item.absolutePath)}">
                        <td class="checkbox-cell">
                            <input type="checkbox" class="row-checkbox" data-path="${this._escapeHtml(item.absolutePath)}" ${checked}>
                        </td>
                        <td class="path-cell" title="${this._escapeHtml(item.relativePath)}">${this._escapeHtml(item.relativePath)}</td>
                        <td class="size-cell ${sizeClass}">${this._formatSize(item.fileSize)}</td>
                        <td>${dims}</td>
                        <td>${item.format.toUpperCase()}</td>
                        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                        <td>${atlasText}</td>
                        <td style="font-size:10px;color:#999;">${suggestion}</td>
                    </tr>
                `);
            }

            tbody.innerHTML = rows.join('');

            // 綁定 checkbox 事件
            const self = this;
            tbody.querySelectorAll('.row-checkbox').forEach((cb) => {
                cb.addEventListener('change', (e) => {
                    const imgPath = e.target.dataset.path;
                    if (e.target.checked) {
                        self._selectedPaths.add(imgPath);
                    } else {
                        self._selectedPaths.delete(imgPath);
                    }
                    self._updateBatchBar();
                });
            });

            // 綁定路徑點擊 → 定位資源
            tbody.querySelectorAll('.path-cell').forEach((cell) => {
                cell.addEventListener('click', () => {
                    const row = cell.closest('tr');
                    const filePath = row?.dataset.path;
                    if (filePath) {
                        self._locateAsset(filePath);
                    }
                });
            });

            this._updateBatchBar();
        },

        _toggleSelectAll() {
            const selectAll = this.$.selectAll;
            const checkboxes = this.$.tableBody.querySelectorAll('.row-checkbox');

            if (selectAll.checked) {
                checkboxes.forEach((cb) => {
                    cb.checked = true;
                    this._selectedPaths.add(cb.dataset.path);
                });
            } else {
                checkboxes.forEach((cb) => {
                    cb.checked = false;
                    this._selectedPaths.delete(cb.dataset.path);
                });
            }
            this._updateBatchBar();
        },

        _updateBatchBar() {
            const count = this._selectedPaths.size;
            this.$.selectedCount.textContent = String(count);
            this.$.batchBar.style.display = count > 0 ? 'flex' : 'none';
        },

        async _applyCompression() {
            if (this._selectedPaths.size === 0) return;

            const format = this.$.compressFormat.value;
            const quality = this.$.compressQuality.value;
            const count = this._selectedPaths.size;

            const confirmed = confirm(
                `確定要為 ${count} 張圖片套用壓縮設定嗎？\n\n` +
                `格式: ${format.toUpperCase()}\n品質: ${quality}\n\n` +
                `此操作會修改這些圖片的 .meta 檔案。`
            );

            if (!confirmed) return;

            const applyBtn = this.$.applyCompressBtn;
            applyBtn.disabled = true;
            applyBtn.textContent = '⏳ 套用中...';

            try {
                const result = await Editor.Message.request(
                    'image-compression-checker',
                    'batchCompress',
                    {
                        imagePaths: Array.from(this._selectedPaths),
                        format,
                        quality,
                    }
                );

                if (result) {
                    const msg = `套用完成！成功: ${result.success}，失敗: ${result.failed}`;
                    console.log(`[ImageCompressionChecker] ${msg}`);

                    if (result.errors && result.errors.length > 0) {
                        console.warn('[ImageCompressionChecker] 失敗項目:', result.errors);
                    }

                    // 重新掃描刷新結果
                    this._selectedPaths.clear();
                    await this._doScan();
                }
            } catch (e) {
                console.error('[ImageCompressionChecker] 批次壓縮失敗:', e);
            } finally {
                applyBtn.disabled = false;
                applyBtn.textContent = '✅ 套用壓縮設定';
            }
        },

        async _locateAsset(absolutePath) {
            try {
                const dbUrl = await Editor.Message.request(
                    'asset-db',
                    'query-url',
                    absolutePath
                );
                if (dbUrl) {
                    Editor.Message.send('assets', 'twinkle', dbUrl);
                }
            } catch (e) {
                // 靜默失敗
            }
        },

        _getCategoryLabel(category) {
            switch (category) {
                case 'loose_uncompressed': return '🔴 散圖未壓縮';
                case 'atlas_uncompressed': return '🟡 圖集未壓縮';
                case 'atlas_invalid_preset': return '🟠 Preset 無效';
                case 'loose_compressed': return '🔵 散圖已壓縮';
                case 'atlas_compressed': return '🟢 圖集已壓縮';
                default: return category;
            }
        },

        _getShortSuggestion(category) {
            switch (category) {
                case 'loose_uncompressed': return '建議入圖集+壓縮';
                case 'atlas_uncompressed': return '設定圖集壓縮';
                case 'atlas_invalid_preset': return '設定有效 Preset';
                case 'loose_compressed': return '建議入圖集';
                case 'atlas_compressed': return '✓';
                default: return '';
            }
        },

        _formatSize(bytes) {
            if (bytes === 0) return '0 B';
            const units = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            const size = (bytes / Math.pow(1024, i)).toFixed(1);
            return `${size} ${units[i]}`;
        },

        _escapeHtml(str) {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        },
    },
});
