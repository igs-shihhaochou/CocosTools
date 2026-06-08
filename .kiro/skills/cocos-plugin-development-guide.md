---
inclusion: auto
---

# Cocos Creator 3.8.x 編輯器擴展開發指南

## 基於三個工具的實戰經驗總結

本指南整合了 image-compression-checker、uuid-resetter、missing-reference-checker 三個工具的開發經驗。

---

## 擴展結構標準模板

```
extensions/my-extension/
├── package.json          # 插件設定（必須註冊所有 messages）
├── tsconfig.json         # TypeScript 設定（lib 含 DOM）
├── assets-menu.js        # 右鍵選單（獨立 JS 檔）
├── .gitignore            # 排除 node_modules/ dist/
├── src/
│   ├── main.ts          # 主進程
│   ├── editor.d.ts      # Editor 型別宣告
│   ├── types.ts         # 型別定義
│   └── panels/
│       └── default.ts   # 面板（// @ts-nocheck）
├── dist/                 # 編譯產出
├── i18n/
│   ├── zh.js
│   └── en.js
└── README.md
```

---

## package.json 必要設定

```json
{
  "name": "my-extension",
  "main": "./dist/main.js",
  "editor": ">=3.8.0",
  "panels": {
    "default": {
      "title": "面板標題",
      "type": "dockable",
      "main": "./dist/panels/default.js"
    }
  },
  "contributions": {
    "menu": [...],
    "assets": {
      "menu": {
        "methods": "./assets-menu.js",
        "assetMenu": "onAssetMenu"
      }
    },
    "messages": {
      // 每個需要被 Editor.Message.request 呼叫的方法都必須在此註冊
    }
  }
}
```

**關鍵規則：所有被 `Editor.Message.request` 呼叫的方法必須在 messages 中註冊，否則報 "Message does not exist"。**

---

## 右鍵選單（assets-menu.js）

```javascript
exports.onAssetMenu = function (assetInfo) {
    if (!assetInfo.isDirectory) return [];
    return [{
        label: '我的操作',
        click() {
            Editor.Message.send('my-extension', 'my-method', assetInfo.url);
        },
    }];
};
```

assetInfo 包含：`displayName`、`isDirectory`、`url`（db://assets/...）、`uuid`、`file`（絕對路徑）

---

## 面板 ↔ 主進程通訊（輪詢模式）

面板無法接收主進程發送的訊息，必須用輪詢：

**主進程：**
```typescript
let _pendingData = '';
let _version = 0;

export const methods = {
    triggerAction(data: string) {
        _pendingData = data;
        _version++;
        Editor.Panel.open('my-extension.default');
    },
    getPendingData() {
        return { data: _pendingData, version: _version };
    },
};
```

**面板：**
```javascript
ready() {
    this._lastVersion = 0;
    this._pollTimer = setInterval(async () => {
        const result = await Editor.Message.request('my-extension', 'getPendingData');
        if (result.version > this._lastVersion) {
            this._lastVersion = result.version;
            // 處理新資料
        }
    }, 500);
}
```

---

## 選中場景節點

```typescript
await Editor.Message.request('selection', 'select', 'node', [nodeUuid]);
// nodeUuid = 場景 JSON 中 cc.Node 的 _id 欄位
// 必須是陣列格式 [uuid]
```

---

## UUID 壓縮格式（23 字元）

場景中 `__type__` 欄位使用壓縮格式：
- 前 5 hex 直接保留
- 剩餘 27 hex → 108 bits → 18 base64 字元
- 共 5 + 18 = 23 字元

```typescript
function compressUuid(uuid: string): string {
    const hex = uuid.replace(/-/g, '');
    const first5 = hex.slice(0, 5);
    let bits = '';
    for (const ch of hex.slice(5)) bits += parseInt(ch, 16).toString(2).padStart(4, '0');
    let b64 = '';
    for (let i = 0; i < bits.length; i += 6)
        b64 += BASE64_KEYS[parseInt(bits.slice(i, i + 6).padEnd(6, '0'), 2)];
    return first5 + b64;
}
```

---

## 場景 JSON 解析要點

- 場景/預製體是 JSON 陣列，每個元素有 `__type__` 欄位
- `cc.Node` 有 `_name`、`_parent: { "__id__": X }`、`_components: [{ "__id__": X }]`、`_id`
- 資源引用：`{ "__uuid__": "xxx" }`
- 物件引用：`{ "__id__": X }`（X 為陣列 index）
- `null` 是合法值（未指派），不是 missing

---

## Cocos 專案中重要檔案位置

| 用途 | 路徑 |
|------|------|
| 圖片壓縮預設 | `settings/v2/packages/builder.json` → `textureCompressConfig.userPreset` |
| 引擎內建資源 UUID | `library/.internal-data.json` |
| 資源 UUID | `assets/**/*.meta` → `uuid` + `subMetas.*.uuid` |
| 圖集設定 | `assets/**/*.pac.meta` → `userData.compressSettings` |
| bmFont 關聯 | `*.fnt.meta` → `userData.textureUuid` |

---

## 常見引擎內部型別（不需檢查）

- `cc.*` — 引擎核心元件
- `CC*` — 引擎內部資料（CCPropertyOverrideInfo 等）
- `sp.*` — Spine 相關（sp.Skeleton.SpineSocket 等）
- `dragonBones.*` — DragonBones 相關

---

## 開發 Checklist

- [ ] `package.json` messages 註冊所有方法
- [ ] 右鍵選單用獨立 `assets-menu.js`
- [ ] 面板加 `// @ts-nocheck`
- [ ] `editor.d.ts` 宣告 Editor 型別（含 broadcast）
- [ ] `tsconfig.json` lib 含 DOM
- [ ] 面板用輪詢取得資料（不依賴訊息推送）
- [ ] `npm run build` 編譯後重新載入擴展
- [ ] 完成後更新 `TASKS.md` 打勾
- [ ] Git 推送到 https://github.com/igs-shihhaochou/CocosTools.git

---

## Scene Script（如果需要在場景環境執行）

```javascript
// dist/scene-script.js（手寫，不要讓 tsc 編譯）
const { join } = require('path');
module.paths.push(join(Editor.App.path, 'node_modules'));

exports.load = function () {};
exports.unload = function () {};
exports.methods = {
    myMethod() {
        const { director } = require('cc');
        // 在場景環境中執行
    },
};
```

package.json 中註冊：
```json
"contributions": {
    "scene": { "script": "./dist/scene-script.js" }
}
```

呼叫方式：
```typescript
await Editor.Message.request('scene', 'execute-scene-script', {
    name: 'my-extension',
    method: 'myMethod',
    args: [],
});
```

**注意**：Scene script 不適合用來偵測 Missing Asset（runtime 中值為 null 無法區分），建議直接解析場景 JSON。
