"use strict";

/**
 * 資源管理器右鍵選單擴展
 * 在資料夾上右鍵時顯示「重置 UUID」選項
 */

exports.onAssetMenu = function (assetInfo) {
    // 只在資料夾上顯示
    if (!assetInfo.isDirectory) {
        return [];
    }

    return [
        {
            label: '🔄 重置 UUID（整個資料夾）',
            click() {
                Editor.Message.send('uuid-resetter', 'resetFolderByUrl', assetInfo.url);
            },
        },
    ];
};
