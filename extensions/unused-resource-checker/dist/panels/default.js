"use strict";
/**
 * 未使用資源檢查 - 面板 UI
 */
module.exports = Editor.Panel.define({
    template: /* html */ `
<div id="app" style="display:flex;flex-direction:column;height:100%;padding:12px;font-family:sans-serif;color:#ccc;">
    <div style="margin-bottom:12px;">
        <h2 style="margin:0 0 8px 0;font-size:16px;color:#eee;">未使用資源檢查工具</h2>
        <div id="status" style="font-size:13px;color:#aaa;">等待掃描...</div>
    </div>
    <div id="toolbar" style="margin-bottom:10px;display:none;gap:8px;align-items:center;">
        <button id="btn-select-all" style="padding:4px 12px;cursor:pointer;">全選</button>
        <button id="btn-deselect-all" style="padding:4px 12px;cursor:pointer;">取消全選</button>
        <button id="btn-delete" style="padding:4px 12px;cursor:pointer;background:#c0392b;color:#fff;border:none;border-radius:3px;">刪除勾選項目</button>
        <span id="selected-count" style="margin-left:12px;font-size:12px;color:#aaa;"></span>
    </div>
    <div id="result-list" style="flex:1;overflow-y:auto;border:1px solid #444;border-radius:4px;background:#1e1e1e;"></div>
</div>
    `,
    $: {
        app: '#app',
        status: '#status',
        toolbar: '#toolbar',
        resultList: '#result-list',
        btnSelectAll: '#btn-select-all',
        btnDeselectAll: '#btn-deselect-all',
        btnDelete: '#btn-delete',
        selectedCount: '#selected-count',
    },
    ready() {
        const self = this;
        self._scanResult = null;
        self._checkedSet = new Set();
        self._lastVersion = -1;
        self.$.btnSelectAll.addEventListener('click', () => {
            if (!self._scanResult)
                return;
            self._checkedSet.clear();
            const seen = new Set();
            for (const a of self._scanResult.unusedAssets) {
                if (!seen.has(a.dbUrl)) {
                    seen.add(a.dbUrl);
                    self._checkedSet.add(a.dbUrl);
                }
            }
            self._renderList();
        });
        self.$.btnDeselectAll.addEventListener('click', () => {
            self._checkedSet.clear();
            self._renderList();
        });
        self.$.btnDelete.addEventListener('click', async () => {
            const toDelete = Array.from(self._checkedSet);
            if (toDelete.length === 0)
                return;
            const msg = '確定刪除 ' + toDelete.length + ' 個資源？此操作不可復原。';
            const confirmed = confirm(msg);
            if (!confirmed)
                return;
            self.$.status.textContent = '刪除中...';
            try {
                const result = await Editor.Message.request('unused-resource-checker', 'deleteAssets', toDelete);
                self.$.status.textContent = '刪除完成：成功 ' + result.success + ' 個，失敗 ' + result.failed + ' 個';
                self._checkedSet.clear();
                await self._doScan(self._scanResult.scanFolderUrl);
            }
            catch (e) {
                self.$.status.textContent = '刪除失敗: ' + e.message;
            }
        });
        // 啟動輪詢
        self._pollTimer = setInterval(() => self._pollPending(), 500);
        self._pollPending();
    },
    close() {
        const self = this;
        if (self._pollTimer) {
            clearInterval(self._pollTimer);
            self._pollTimer = null;
        }
    },
    methods: {
        async _pollPending() {
            const self = this;
            try {
                const info = await Editor.Message.request('unused-resource-checker', 'getPendingScanFolder');
                if (info && info.version > self._lastVersion && info.folder) {
                    self._lastVersion = info.version;
                    await self._doScan(info.folder);
                }
            }
            catch (_a) {
                // 靜默
            }
        },
        async _doScan(folderUrl) {
            const self = this;
            self.$.status.textContent = '掃描中，請稍候...';
            self.$.toolbar.style.display = 'none';
            self.$.resultList.innerHTML = '';
            try {
                const result = await Editor.Message.request('unused-resource-checker', 'scanForPanel', { scanFolder: folderUrl });
                if (!result) {
                    self.$.status.textContent = '掃描失敗或未指定資料夾';
                    return;
                }
                self._scanResult = result;
                self._checkedSet.clear();
                const unusedCount = self._getUniqueUnused().length;
                self.$.status.textContent = '掃描完成（' + result.elapsed + 'ms）：共 ' + result.totalAssets + ' 個資源 UUID，' + unusedCount + ' 個檔案未被引用';
                if (unusedCount > 0) {
                    self.$.toolbar.style.display = 'flex';
                }
                self._renderList();
            }
            catch (e) {
                self.$.status.textContent = '掃描錯誤: ' + e.message;
            }
        },
        _getUniqueUnused() {
            const self = this;
            if (!self._scanResult)
                return [];
            const seen = new Set();
            const unique = [];
            for (const a of self._scanResult.unusedAssets) {
                if (!seen.has(a.dbUrl)) {
                    seen.add(a.dbUrl);
                    unique.push(a);
                }
            }
            return unique;
        },
        _renderList() {
            const self = this;
            const list = self.$.resultList;
            list.innerHTML = '';
            const uniqueAssets = self._getUniqueUnused();
            if (uniqueAssets.length === 0) {
                list.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">所有資源皆已被引用 ✓</div>';
                self.$.selectedCount.textContent = '';
                return;
            }
            for (const asset of uniqueAssets) {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;padding:6px 10px;border-bottom:1px solid #333;font-size:12px;';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = self._checkedSet.has(asset.dbUrl);
                checkbox.style.marginRight = '8px';
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        self._checkedSet.add(asset.dbUrl);
                    }
                    else {
                        self._checkedSet.delete(asset.dbUrl);
                    }
                    self._updateSelectedCount();
                });
                const info = document.createElement('div');
                info.style.cssText = 'flex:1;overflow:hidden;cursor:pointer;';
                info.title = '點擊定位到資源';
                const sizeStr = self._formatSize(asset.fileSize);
                info.innerHTML = '<div style="color:#ddd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + asset.dbUrl + '</div>' +
                    '<div style="color:#888;font-size:11px;">' + asset.extension + ' · ' + sizeStr + '</div>';
                info.addEventListener('click', () => {
                    Editor.Message.send('assets', 'twinkle', asset.dbUrl);
                });
                row.appendChild(checkbox);
                row.appendChild(info);
                list.appendChild(row);
            }
            self._updateSelectedCount();
        },
        _updateSelectedCount() {
            const self = this;
            const count = self._checkedSet.size;
            self.$.selectedCount.textContent = count > 0 ? '已勾選 ' + count + ' 個' : '';
        },
        _formatSize(bytes) {
            if (bytes < 1024)
                return bytes + ' B';
            if (bytes < 1024 * 1024)
                return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        },
    },
});
//# sourceMappingURL=default.js.map