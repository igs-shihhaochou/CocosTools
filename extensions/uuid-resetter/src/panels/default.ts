// @ts-nocheck
/**
 * UUID 重置工具面板
 * 顯示預覽資訊、確認操作、執行進度、結果報告
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

    .header {
        padding: 12px;
        background: #1e1e1e;
        border-bottom: 1px solid #3c3c3c;
    }

    .header h2 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #fff;
    }

    .folder-path {
        padding: 4px 8px;
        background: #3c3c3c;
        border-radius: 3px;
        color: #6cb6ff;
        font-size: 11px;
        display: inline-block;
    }

    .content {
        flex: 1;
        padding: 16px;
        overflow: auto;
    }

    .preview-info {
        background: #2d2d30;
        border: 1px solid #3c3c3c;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 16px;
    }

    .preview-info .row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
    }

    .preview-info .label {
        color: #999;
    }

    .preview-info .value {
        color: #fff;
        font-weight: bold;
    }

    .warning {
        background: #5c3a10;
        border: 1px solid #ff8c00;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 16px;
        color: #ffcc80;
    }

    .warning .icon {
        font-size: 16px;
        margin-right: 8px;
    }

    .actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
    }

    button {
        padding: 6px 16px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    }

    button.primary {
        background: #c24038;
        color: #fff;
    }

    button.primary:hover {
        background: #d45048;
    }

    button.primary:disabled {
        background: #555;
        cursor: not-allowed;
    }

    button.secondary {
        background: #3c3c3c;
        color: #ccc;
    }

    .result {
        background: #1e3f1e;
        border: 1px solid #5cb85c;
        border-radius: 4px;
        padding: 12px;
        color: #a8e6a8;
    }

    .result.error {
        background: #3f1e1e;
        border-color: #c24038;
        color: #f48771;
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

    .progress {
        margin-top: 12px;
        color: #6cb6ff;
    }
</style>

<div class="header">
    <h2>🔄 UUID 重置工具</h2>
    <span class="folder-path" id="folderPath" style="display:none;"></span>
</div>

<div class="content">
    <div class="empty-state" id="emptyState">
        <div class="icon">🔑</div>
        <p>在資源管理器中右鍵資料夾，選擇「重置 UUID」開始操作</p>
    </div>

    <div id="previewSection" style="display:none;">
        <div class="preview-info" id="previewInfo">
            <div class="row">
                <span class="label">將重置的 UUID 數量:</span>
                <span class="value" id="uuidCount">0</span>
            </div>
            <div class="row">
                <span class="label">涉及的檔案數量:</span>
                <span class="value" id="fileCount">0</span>
            </div>
        </div>

        <div class="warning">
            <span class="icon">⚠️</span>
            <strong>此操作不可逆！</strong><br>
            建議在執行前先提交 Git，以便需要時回滾。<br>
            重置後，資料夾外部對這些資源的引用將會斷裂。
        </div>

        <div class="actions">
            <button class="primary" id="executeBtn">🔄 確認重置</button>
            <button class="secondary" id="cancelBtn">取消</button>
        </div>

        <div class="progress" id="progressText" style="display:none;"></div>
        <div class="result" id="resultBox" style="display:none;"></div>
    </div>
</div>
`;

module.exports = Editor.Panel.define({
    template: panelTemplate,
    $: {
        folderPath: '#folderPath',
        emptyState: '#emptyState',
        previewSection: '#previewSection',
        previewInfo: '#previewInfo',
        uuidCount: '#uuidCount',
        fileCount: '#fileCount',
        executeBtn: '#executeBtn',
        cancelBtn: '#cancelBtn',
        progressText: '#progressText',
        resultBox: '#resultBox',
    },

    ready() {
        this._lastResetVersion = 0;
        this._currentFolder = '';
        this._pollTimer = null;

        this.$.executeBtn.addEventListener('click', () => this._executeReset());
        this.$.cancelBtn.addEventListener('click', () => this._cancel());

        this._startPolling();
    },

    close() {
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    },

    methods: {
        _startPolling() {
            this._pollTimer = setInterval(async () => {
                try {
                    const result = await Editor.Message.request(
                        'uuid-resetter',
                        'getPendingResetFolder'
                    );
                    if (result && result.version > this._lastResetVersion && result.folder) {
                        this._lastResetVersion = result.version;
                        this._currentFolder = result.folder;
                        this._showPreview(result.folder);
                    }
                } catch (e) {}
            }, 500);
        },

        async _showPreview(folderUrl) {
            this.$.emptyState.style.display = 'none';
            this.$.previewSection.style.display = 'block';
            this.$.resultBox.style.display = 'none';
            this.$.progressText.style.display = 'none';
            this.$.executeBtn.disabled = false;

            this.$.folderPath.textContent = `📁 ${folderUrl}`;
            this.$.folderPath.style.display = 'inline-block';

            try {
                const preview = await Editor.Message.request(
                    'uuid-resetter',
                    'getResetPreview',
                    folderUrl
                );

                if (preview) {
                    this.$.uuidCount.textContent = String(preview.uuidCount);
                    this.$.fileCount.textContent = String(preview.fileCount);
                }
            } catch (e) {
                console.error('[UuidResetter Panel] 預覽失敗:', e);
            }
        },

        async _executeReset() {
            if (!this._currentFolder) return;

            this.$.executeBtn.disabled = true;
            this.$.progressText.style.display = 'block';
            this.$.progressText.textContent = '⏳ 正在重置 UUID（掃描 → 替換 → 驗證）...';

            try {
                const result = await Editor.Message.request(
                    'uuid-resetter',
                    'executeReset',
                    this._currentFolder
                );

                this.$.progressText.style.display = 'none';
                this.$.resultBox.style.display = 'block';

                if (result && result.success) {
                    this.$.resultBox.className = 'result';
                    this.$.resultBox.innerHTML = `
                        ✅ UUID 重置完成！<br><br>
                        • 重置 UUID 數量: <strong>${result.uuidResetCount}</strong><br>
                        • 更新引用數量: <strong>${result.referenceUpdateCount}</strong><br>
                        • 修改檔案數量: <strong>${result.modifiedFileCount}</strong><br>
                        • 耗時: ${result.duration}ms<br>
                        ${result.mappingFilePath ? `<br>📄 映射表已匯出至資料夾下 <code>_uuid-reset-mapping.json</code>` : ''}
                        ${result.errors && result.errors.length > 0 ? `<br>⚠️ ${result.errors.length} 個警告（請查看 Console）` : ''}
                    `;
                } else {
                    this.$.resultBox.className = 'result error';
                    const errorMsg = result?.errors?.[0]?.error || '未知錯誤';
                    this.$.resultBox.textContent = `❌ 重置失敗: ${errorMsg}`;
                }
            } catch (e) {
                this.$.progressText.style.display = 'none';
                this.$.resultBox.style.display = 'block';
                this.$.resultBox.className = 'result error';
                this.$.resultBox.textContent = `❌ 錯誤: ${e}`;
            }
        },

        _cancel() {
            this.$.previewSection.style.display = 'none';
            this.$.emptyState.style.display = 'flex';
            this.$.folderPath.style.display = 'none';
            this._currentFolder = '';
        },
    },
});
