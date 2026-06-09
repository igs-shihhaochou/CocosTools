"use strict";

/**
 * 資源管理器右鍵選單擴展
 * 在資料夾上右鍵時顯示「檢查未使用資源」選項
 */

exports.onAssetMenu = function (assetInfo) {
    if (!assetInfo.isDirectory) {
        return [];
    }

    return [
        {
            label: '檢查未使用資源',
            click() {
                Editor.Message.send('unused-resource-checker', 'scan-folder-by-url', assetInfo.url);
            },
        },
    ];
};
