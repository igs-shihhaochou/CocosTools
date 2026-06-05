"use strict";

module.exports = {
    "title": "圖片壓縮檢查",
    "description": "掃描專案中所有圖片資源，檢查壓縮狀態與圖集歸屬",
    "menu": {
        "openPanel": "開啟面板",
        "scanQuick": "快速掃描（Console 輸出）"
    },
    "panel": {
        "scan": "掃描",
        "scanning": "掃描中...",
        "total": "圖片總數",
        "totalSize": "總大小",
        "uncompressed": "未壓縮",
        "estimatedSaving": "預估可節省",
        "path": "路徑",
        "size": "大小",
        "dimensions": "尺寸",
        "format": "格式",
        "status": "狀態",
        "atlas": "圖集",
        "action": "建議動作"
    },
    "status": {
        "looseUncompressed": "散圖未壓縮",
        "atlasUncompressed": "圖集未壓縮",
        "looseCompressed": "散圖已壓縮",
        "atlasCompressed": "圖集已壓縮",
        "notInAtlas": "未入圖集"
    }
};
