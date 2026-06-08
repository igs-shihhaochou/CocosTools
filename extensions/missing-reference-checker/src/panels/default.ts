// @ts-nocheck
/**
 * Missing 引用檢查面板
 * 顯示掃描結果，支援點擊節點路徑在場景中定位
 *
 * 注意：此檔案在 Cocos Creator 面板環境中執行，
 * 使用輪詢機制從主進程取得掃描結果。
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
        color: #f48771;
    }

    .summary-item.good .value {
        color: #5cb85c;
    }

    .summary-item.info .value {
        color: #6cb6ff;
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
    }

    td {
        padding: 5px 8px;
        border-bottom: 1px solid #2d2d30;
        vertical-align: middle;
    }

    tr:hover td {
        background: #2a2d2e;
    }

    .node-path-cell {
        max-width: 350px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
        color: #4fc1ff;
    }

    .node-path-cell:hover {
        text-decoration: underline;
    }

    .type-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
    }

    .type-badge.script {
        background: #5c2020;
        color: #f48771;
    }

    .type-badge.asset {
        background: #5c4b20;
        color: #f0ad4e;
    }

    .detail-cell {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #999;
        font-family: monospace;
        font-size: 10px;
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

    .source-info {
        padding: 2px 8px;
        background: #3c3c3c;
        border-radius: 3px;
        color: #6cb6ff;
        font-size: 11px;
    }

    .status-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: #1e1e1e;
        border-top: 1px solid #3c3c3c;
        font-size: 11px;
        color: #888;
    }
</style>

<div class="toolbar">
    <button id="scanSceneBtn">🔍 掃描當前場景</button>
    <span id="sourceInfo" class="source-info" style="display:none;"></span>
</div>

<div class="summary" id="summaryBar" style="display:none;">
    <div class="summary-item info">
        <span>🗂️ 來源:</span>
        <span class="value" id="sourceLabel">—</span>
    </div>
    <div class="summary-item">
        <span>📦 節點數:</span>
        <span class="value" id="totalNodes">0</span>
    </div>
    <div class="summary-item warn">
        <span>⚠️ Missing:</span>
        <span class="value" id="missingCount">0</span>
    </div>
    <div class="summary-item">
        <span>⏱️ 耗時:</span>
        <span class="value" id="duration">0ms</span>
    </div>
</div>

<div class="table-container" id="tableContainer">
    <div class="empty-state" id="emptyState">
        <div class="icon">🔎</div>
        <p>點擊「掃描當前場景」或右鍵 Prefab 開始檢查 Missing 引用</p>
    </div>
    <table id="resultTable" style="display:none;">
        <thead>
            <tr>
                <th>#</th>
                <th>節點路徑</th>
                <th>類型</th>
                <th>詳細資訊</th>
                <th>Component</th>
            </tr>
        </thead>
        <tbody id="tableBody">
        </tbody>
    </table>
</div>

<div class="status-bar" id="statusBar">
    <span id="statusText">就緒</span>
</div>
`;

module.exports = Editor.Panel.define({
    template: panelTemplate,
    $: {
        scanSceneBtn: '#scanSceneBtn',
        sourceInfo: '#sourceInfo',
        summaryBar: '#summaryBar',
        sourceLabel: '#sourceLabel',
        totalNodes: '#totalNodes',
        missingCount: '#missingCount',
        duration: '#duration',
        tableContainer: '#tableContainer',
        emptyState: '#emptyState',
        resultTable: '#resultTable',
        tableBody: '#tableBody',
        statusBar: '#statusBar',
        statusText: '#statusText',
    },

    ready() {
        this._lastScanVersion = 0;
        this._pollTimer = null;
        this._result = null;

        this._bindEvents();
        this._startPolling();
        this._checkPendingScan();
    },

    close() {
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
        this._result = null;
    },

    methods: {
        _bindEvents() {
            this.$.scanSceneBtn.addEventListener('click', () => this._doScanScene());
        },

        /**
         * 啟動輪詢，定期檢查主進程是否有新的掃描結果
         */
        _startPolling() {
            this._pollTimer = setInterval(async () => {
                try {
                    const pending = await Editor.Message.request(
                        'missing-reference-checker',
                        'getPendingScan'
                    );
                    if (pending && pending.version > this._lastScanVersion) {
                        this._lastScanVersion = pending.version;
                        // 有新的掃描觸發，取得結果
                        await this._fetchResult();
                    }
                } catch (e) {
                    // 靜默
                }
            }, 500);
        },

        /**
         * 面板初始化時檢查是否已有待處理的掃描
         */
        async _checkPendingScan() {
            try {
                const pending = await Editor.Message.request(
                    'missing-reference-checker',
                    'getPendingScan'
                );
                if (pending && pending.version > 0) {
                    this._lastScanVersion = pending.version;
                    await this._fetchResult();
                }
            } catch (e) {
                // 靜默
            }
        },

        /**
         * 從主進程取得最新掃描結果
         */
        async _fetchResult() {
            try {
                const result = await Editor.Message.request(
                    'missing-reference-checker',
                    'getLastResult'
                );
                if (result) {
                    this._result = result;
                    this._renderResult();
                }
            } catch (e) {
                console.error('[MissingReferenceChecker Panel] 取得結果失敗:', e);
            }
        },

        /**
         * 從面板觸發場景掃描
         */
        async _doScanScene() {
            const btn = this.$.scanSceneBtn;
            btn.disabled = true;
            btn.textContent = '⏳ 掃描中...';
            this.$.statusText.textContent = '正在掃描場景...';

            try {
                await Editor.Message.request(
                    'missing-reference-checker',
                    'scanCurrentScene'
                );
                // 掃描完成後 fetchResult
                await this._fetchResult();
            } catch (e) {
                console.error('[MissingReferenceChecker Panel] 掃描失敗:', e);
                this.$.statusText.textContent = '掃描失敗';
            } finally {
                btn.disabled = false;
                btn.textContent = '🔍 掃描當前場景';
            }
        },

        /**
         * 渲染掃描結果
         */
        _renderResult() {
            const result = this._result;
            if (!result) return;

            // 更新摘要
            this.$.summaryBar.style.display = 'flex';
            this.$.sourceLabel.textContent = result.source;
            this.$.totalNodes.textContent = String(result.totalNodes);
            this.$.missingCount.textContent = String(result.missingCount);
            this.$.duration.textContent = `${result.duration}ms`;

            // 更新狀態列
            if (result.missingCount === 0) {
                this.$.statusText.textContent = '✅ 未發現 Missing 引用';
            } else {
                this.$.statusText.textContent = `⚠️ 發現 ${result.missingCount} 個 Missing 引用`;
            }

            // 渲染表格
            if (result.results.length === 0) {
                this.$.emptyState.style.display = 'flex';
                this.$.emptyState.querySelector('p').textContent = '✅ 太好了！沒有發現 Missing 引用';
                this.$.emptyState.querySelector('.icon').textContent = '🎉';
                this.$.resultTable.style.display = 'none';
                return;
            }

            this.$.emptyState.style.display = 'none';
            this.$.resultTable.style.display = 'table';

            const tbody = this.$.tableBody;
            const rows = [];

            for (let i = 0; i < result.results.length; i++) {
                const item = result.results[i];
                const typeClass = item.missingType === 'script' ? 'script' : 'asset';
                const typeLabel = item.missingType === 'script' ? '🔴 腳本遺失' : '🟡 資源遺失';

                rows.push(`
                    <tr data-uuid="${this._escapeHtml(item.nodeUuid || '')}">
                        <td>${i + 1}</td>
                        <td class="node-path-cell" title="${this._escapeHtml(item.nodePath)}">${this._escapeHtml(item.nodePath)}</td>
                        <td><span class="type-badge ${typeClass}">${typeLabel}</span></td>
                        <td class="detail-cell" title="${this._escapeHtml(item.detail)}">${this._escapeHtml(item.detail)}</td>
                        <td>${item.componentIndex}</td>
                    </tr>
                `);
            }

            tbody.innerHTML = rows.join('');

            // 綁定路徑點擊 → 在場景中定位節點
            const self = this;
            tbody.querySelectorAll('.node-path-cell').forEach((cell) => {
                cell.addEventListener('click', () => {
                    const row = cell.closest('tr');
                    const uuid = row?.dataset?.uuid;
                    if (uuid) {
                        self._focusNode(uuid);
                    }
                });
            });
        },

        /**
         * 在場景中聚焦到指定節點
         */
        async _focusNode(uuid) {
            if (!uuid) return;
            // 嘗試多種方式選中節點
            try {
                // 方式 1: selection select (array format)
                await Editor.Message.request('selection', 'select', 'node', [uuid]);
                return;
            } catch (e1) {}
            try {
                // 方式 2: selection select (single)
                await Editor.Message.request('selection', 'select', 'node', uuid);
                return;
            } catch (e2) {}
            try {
                // 方式 3: broadcast
                Editor.Message.broadcast('selection:select', 'node', [uuid]);
            } catch (e3) {
                console.warn('[MissingReferenceChecker] 無法定位節點:', uuid);
            }
        },

        _escapeHtml(str) {
            if (!str) return '';
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        },
    },
});
