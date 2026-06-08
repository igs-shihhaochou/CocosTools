---
inclusion: auto
---

# Missing 引用檢查工具 — 開發筆記

## 工具位置
`extensions/missing-reference-checker/`

## 核心偵測邏輯（正確 SOP）

### ❌ 錯誤方向（踩過的坑）
- 不要用 scene-script 在 runtime 遍歷元件檢查 `isValid`
- Missing Asset 在 runtime 中值可能是 null（無法區分「未設定」和「遺失」）
- `instanceof CCObject && !isValid` 無法可靠偵測 missing asset

### ✅ 正確做法：直接解析場景 JSON 比對 UUID
1. 讀取 `.scene` / `.prefab` 檔案（JSON 陣列）
2. 建立 `cc.Node` 索引 → 組出節點路徑
3. 遍歷所有物件，遞迴找含 `{ "__uuid__": "xxx" }` 的屬性引用
4. 掃描 `assets/**/*.meta` 收集所有有效 UUID（含 subMetas）
5. 若場景中的 `__uuid__` 不在 meta 集合中 → **Missing Asset**
6. `__type__` 為 `cc.MissingScript` → **Missing Script**

### 關鍵規則
- 只檢查有 `__uuid__` 且值為非空字串的引用
- `__prefab: null`、`_customMaterial: null` 等為正常，不算 missing
- `__type__` 和 `__id__` 不需要檢查
- UUID 比對時需同時比對帶 `@hash` 和不帶的版本

## Scene Script 的坑

### 正確格式（如果需要用）
```javascript
const { join } = require('path');
module.paths.push(join(Editor.App.path, 'node_modules'));

exports.load = function () {};
exports.unload = function () {};
exports.methods = {
    myMethod() {
        const { director } = require('cc');
        // ...
    },
};
```

### 關鍵要點
- 必須有 `exports.load`、`exports.unload`、`exports.methods`
- `cc` 模組要用 `require('cc')`（不能 import）
- 需要先 `module.paths.push(join(Editor.App.path, 'node_modules'))`
- TypeScript 編譯會把 `import { x } from 'cc'` 轉成 `require("cc")` 但缺少 module path push → 改為手寫 JS 並排除 tsconfig

## 面板 ↔ 主進程通訊
- 使用輪詢模式（同其他工具）
- 選單觸發 `scanCurrentScene` → 先開面板再掃描
- 面板透過 `getLastResult` 取得結果

## 節點定位（已確認可用）

正確 API：
```typescript
await Editor.Message.request('selection', 'select', 'node', [nodeUuid]);
```
- `nodeUuid` 來自場景 JSON 中 `cc.Node` 的 `_id` 欄位
- 參數必須是**陣列**格式 `[uuid]`
- 呼叫後層級管理器會自動選中並展開到該節點

## Missing 偵測的正確邏輯（最終版）

### 兩遍掃描法

**第一遍：收集所有 missing script 的 index**
- `__type__` === `"cc.MissingScript"` → missing
- `__type__` 是 22-25 字元壓縮 UUID 且解壓後不在有效 UUID 集合中 → missing
- 跳過 `cc.*`、`CC*`、`sp.*`、`dragonBones.*` 開頭的引擎類型
- 找不到 owner node 的（`findOwnerNode === -1`）跳過（內部資料結構）

**第二遍：掃描屬性引用**
- `{ "__uuid__": "xxx" }` 且 UUID 不在有效集合中 → Missing Asset
- `{ "__id__": X }` 且 X 在第一遍的 missingScriptIndices 集合中 → Missing Component
- `null` → 合法，跳過
- 其他 `{ "__id__": X }` → 正常引用，跳過

### 有效 UUID 集合來源
- `assets/**/*.meta` 中的 `uuid` + `subMetas` 中的 `uuid`
- `library/.internal-data.json` 中的所有 key（引擎內建資源）

## 踩過的坑總結

### Scene Script 不適合用來偵測 Missing
- runtime 中 missing asset 的值可能是 null，無法區分「未設定」和「遺失」
- 正確做法是直接解析場景 JSON 比對 UUID

### __type__ 為壓縮 UUID 不代表一定是 missing
- 需要解壓後比對 meta UUID 集合
- 引擎內部類型（`sp.Skeleton.SpineSocket`、`CCPropertyOverrideInfo` 等）不是壓縮 UUID

### __id__ 引用不能無差別檢查
- 只有指向已確認 missing script 的引用才報告
- 否則正常的元件/節點引用會被誤判（如 sp.Skeleton 的 socket targets）

### 選中節點的正確 API
- ❌ `Editor.Message.send('scene', 'focus-node', uuid)`
- ❌ `Editor.Message.send('selection', 'select', 'node', uuid)`
- ✅ `Editor.Message.request('selection', 'select', 'node', [uuid])`（陣列格式）
