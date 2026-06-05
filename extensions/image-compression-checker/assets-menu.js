"use strict";

/**
 * 資源管理器右鍵選單擴展
 * 在資料夾上右鍵時顯示「掃描圖片壓縮狀態」選項
 */

exports.onAssetMenu = function (assetInfo) {
    // 只在資料夾上顯示
    if (!assetInfo.isDirectory) {
        return [];
    }

    return [
        {
            label: '掃描圖片壓縮狀態',
            click() {
                // 發送訊息給主進程，帶入資料夾的 URL
                Editor.Message.send('image-compression-checker', 'scan-folder-by-url', assetInfo.url);
            },
        },
    ];
};

exports.onDBMenu = function (assetInfo) {
    return [
        {
            label: '掃描圖片壓縮狀態（全專案）',
            click() {
                Editor.Message.send('image-compression-checker', 'open-panel');
            },
        },
    ];
};
