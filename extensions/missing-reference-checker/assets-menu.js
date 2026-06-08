"use strict";

/**
 * 資源管理器右鍵選單擴展
 * 在 .prefab 檔案上右鍵時顯示「檢查 Missing 引用」選項
 */

exports.onAssetMenu = function (assetInfo) {
    // 只在 .prefab 檔案上顯示
    if (!assetInfo.file || !assetInfo.file.endsWith('.prefab')) {
        return [];
    }

    return [
        {
            label: '檢查 Missing 引用',
            click() {
                Editor.Message.send('missing-reference-checker', 'scanPrefab', assetInfo.file);
            },
        },
    ];
};
