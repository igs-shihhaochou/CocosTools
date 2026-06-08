---
inclusion: auto
---

# Cocos Creator 編輯器擴展開發踩坑紀錄

## 本文件記錄開發 Cocos Creator 3.8.x 編輯器擴展時遇到的實際問題與正確做法，避免重複犯錯。

---

## 1. Messages 必須在 package.json 中註冊

### 問題
面板透過 `Editor.Message.request('extension-name', 'methodName')` 呼叫主進程方法時，Console 報錯：
```
Error: Message does not exist: extension-name - methodName
```

### 原因
Cocos Creator 要求**所有**可被 `Editor.Message.request` 或 `Editor.Message.send` 呼叫的方法，都必須在 `package.json` 的 `contributions.messages` 中明確宣告。

### 正確做法
```json
{
  "contributions": {
    "messages": {
      "scanForPanel": {
        "methods": ["scanForPanel"]
      },
      "batchCompress": {
        "methods": ["batchCompress"]
      }
    }
  }
}
```

### 規則
- `main.ts` 的 `methods` 物件中每新增一個需要被外部呼叫的方法，就必須同步在 `package.json` 的 `messages` 中註冊
- 面板內部呼叫主進程也算「外部呼叫」
- 訊息名稱（key）就是 `Editor.Message.request` 的第二個參數

---

## 2. 資源管理器右鍵選單的正確註冊方式

### 問題
在 `package.json` 中用陣列格式註冊右鍵選單不會生效：
```json
// ❌ 錯誤做法
"assets": {
  "menu": [
    { "label": "掃描", "message": "scan-folder" }
  ]
}
```

### 正確做法
Cocos Creator 3.x 的資源管理器右鍵選單需要透過**獨立 JS 檔案**的回呼函式來動態返回選單項目：

**package.json:**
```json
{
  "contributions": {
    "assets": {
      "menu": {
        "methods": "./assets-menu.js",
        "assetMenu": "onAssetMenu",
        "dbMenu": "onDBMenu"
      }
    }
  }
}
```

**assets-menu.js:**
```javascript
exports.onAssetMenu = function (assetInfo) {
    if (!assetInfo.isDirectory) return [];
    return [
        {
            label: '掃描圖片壓縮狀態',
            click() {
                Editor.Message.send('my-extension', 'my-message', assetInfo.url);
            },
        },
    ];
};
```

### assetInfo 參數包含
- `displayName` — 資源顯示名
- `isDirectory` — 是否為資料夾
- `url` — 資源 URL（db://assets/...）
- `uuid` — 資源 UUID
- `type` — 資源類型
- `file` — 磁碟絕對路徑

### 支援的右鍵位置（where）
- `createMenu` — 新建資源選單（左上角 + 按鈕 / 右鍵的「創建」子選單）
- `dbMenu` — 資源資料庫根節點（assets 根目錄）
- `assetMenu` — 一般資源/資料夾節點
- `panelMenu` — 面板空白區域

---

## 3. 面板中存取 this.$ 和實例屬性

### 問題
TypeScript strict 模式下，面板的 `methods` 內存取 `this.$` 和自定義屬性（如 `this._report`）會報型別錯誤。

### 正確做法
面板檔案頂部加 `// @ts-nocheck`，因為面板框架會在運行時注入 `this.$`、`this._report` 等。

```typescript
// @ts-nocheck
module.exports = Editor.Panel.define({
    $: { scanBtn: '#scanBtn' },
    ready() {
        this._report = null;      // 運行時自行掛載
        this._selectedPaths = new Set();
    },
    methods: {
        _doScan() {
            this.$.scanBtn.disabled = true;  // this.$ 由框架注入
        }
    }
});
```

### 注意
- 自定義屬性要在 `ready()` 中初始化
- 不要在 TypeScript 嘗試為面板定義 class，直接用 `Editor.Panel.define({})` 物件格式

---

## 4. Editor 全域型別宣告

### 問題
`Editor.Panel`、`Editor.Message`、`Editor.Project` 等在 TypeScript 中報 `Cannot find name 'Editor'`。

### 正確做法
在 `src/` 下建立 `editor.d.ts`：
```typescript
declare namespace Editor {
    namespace Panel {
        function open(panelId: string): void;
        function define(options: any): any;
    }
    namespace Project {
        const path: string;
    }
    namespace Message {
        function request(extensionName: string, method: string, ...args: any[]): Promise<any>;
        function send(extensionName: string, method: string, ...args: any[]): void;
    }
}
```

---

## 5. tsconfig.json 需加入 DOM lib

### 問題
面板程式碼使用 `HTMLButtonElement`、`HTMLSelectElement` 等 DOM 型別會報錯。

### 正確做法
```json
{
  "compilerOptions": {
    "lib": ["ES2017", "DOM"]
  }
}
```

---

## 開發流程 Checklist

每次開發 Cocos Creator 擴展時，確認以下事項：

- [ ] `package.json` 的 `messages` 中註冊了所有需要被呼叫的方法
- [ ] 右鍵選單使用 `assets-menu.js` 獨立檔案 + `methods` 指向
- [ ] 面板檔案加 `// @ts-nocheck`
- [ ] `editor.d.ts` 宣告 Editor 全域型別
- [ ] `tsconfig.json` 的 `lib` 包含 `DOM`
- [ ] 修改後執行 `npm run build` 重新編譯
- [ ] 在 Cocos Creator 的擴展管理器中「重新載入」插件
- [ ] **完成 Task 後更新 `TASKS.md`，將完成項目打勾**


---

## 7. Cocos Creator 3.8.x 紋理壓縮設定的 meta 格式

### 問題
判斷圖片是否已壓縮時，檢查 `compressSettings` 中是否有 object 類型的值，但實際上 3.8.x 使用的是 Preset 模式。

### 實際 meta 格式（Cocos Creator 3.8.5）

**Preset 模式（最常見）：**
```json
{
  "userData": {
    "compressSettings": {
      "useCompressTexture": true,
      "presetId": "default"
    }
  }
}
```
- `useCompressTexture: true` 表示已啟用壓縮
- `presetId` 指向「專案設定 → 紋理壓縮」中定義的預設配置
- 實際的格式（ASTC/ETC2/PVRTC/PNG）存在專案設定中，不在 meta 裡

**直接設定各平台（較少見，手動設定時）：**
```json
{
  "userData": {
    "compressSettings": {
      "web": { "format": "webp", "quality": "normal" },
      "android": { "format": "etc2", "quality": "fast" }
    }
  }
}
```

### 正確的判斷邏輯
```typescript
function hasCompression(settings: any): boolean {
    if (!settings || typeof settings !== 'object') return false;
    // Preset 模式
    if (settings.useCompressTexture === true) return true;
    // 直接設定模式
    for (const [key, value] of Object.entries(settings)) {
        if (key === 'useCompressTexture' || key === 'presetId') continue;
        if (value && typeof value === 'object') return true;
    }
    return false;
}
```

---

## 8. 面板無法直接接收主進程的訊息

### 問題
主進程透過 `Editor.Message.send('extension', 'some-message', data)` 發訊息，期望面板接收處理，但面板的 methods 不會被觸發。

### 原因
Cocos Creator 的訊息系統中，`messages` 只會路由到 `main.ts` 的 `methods`。面板是獨立的渲染進程，不能直接接收主進程發的訊息。

### 正確做法：用全域變數 + 面板主動拉取
```typescript
// main.ts
let _pendingData: string = '';

export const methods = {
    // 右鍵觸發時存住資料
    triggerFromMenu(data: string) {
        _pendingData = data;
        Editor.Panel.open('my-extension.default');
    },
    // 面板主動呼叫取得資料
    getPendingData() {
        const data = _pendingData;
        _pendingData = ''; // 取完清除
        return data;
    },
};

// panel (default.ts)
ready() {
    this._init();
},
methods: {
    async _init() {
        const data = await Editor.Message.request('my-extension', 'getPendingData');
        if (data) {
            // 使用 data
        }
    }
}
```


---

## 9. Cocos Creator 3.x 選中場景節點的正確 API

### 問題
面板中點擊要導航到場景物件，嘗試了多種 API 都無效。

### 正確做法
```typescript
await Editor.Message.request('selection', 'select', 'node', [nodeUuid]);
```

- 第三個參數是 `'node'`（字串）
- 第四個參數是 **UUID 陣列** `[uuid]`（不是單一字串）
- `nodeUuid` 來自場景 JSON 中 `cc.Node` 的 `_id` 欄位
- 呼叫後層級管理器會自動選中並展開到該節點

### 無效的方式
```typescript
// ❌ 這些都不行
Editor.Message.send('scene', 'focus-node', uuid);
Editor.Message.send('selection', 'select', 'node', uuid); // 不是陣列
Editor.Message.request('selection', 'select', { type: 'node', id: uuid });
Editor.Message.send('hierarchy', 'focus', uuid);
```
