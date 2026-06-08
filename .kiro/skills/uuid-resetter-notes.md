---
inclusion: auto
---

# UUID 重置工具 — 開發筆記與設計決策

## 工具位置
`extensions/uuid-resetter/`

## 核心設計邏輯

### UUID 重置流程
1. 掃描資料夾內所有 `.meta` → 收集主 UUID 和 subMeta UUID
2. 產生新 UUID 映射表（舊→新）
3. 替換 `.meta` 中的 UUID（原始格式）
4. 替換引用檔案中的 UUID（原始格式 + 壓縮格式）
5. 驗證沒有殘留的舊 UUID
6. 匯出映射表

### Cocos Creator UUID 壓縮格式（關鍵！）

場景（`.scene`）和預製體（`.prefab`）中的 `__type__` 欄位使用 **23 字元的壓縮格式**，不是原始的 36 字元 UUID。

**壓縮規則：**
- 原始 UUID（去 dash）：32 hex 字元
- 壓縮格式：前 5 hex 字元直接保留 + 剩餘 27 hex 轉為 18 個 Base64 字元 = **23 字元**

**範例：**
```
原始: 08ad7bf9-e10c-4e5c-af56-d1c2428bdc3c
壓縮: 08ad7v54QxOXK9W0cJCi9w8
```

**壓縮演算法（已驗證正確）：**
```typescript
function compressUuid(uuid: string): string {
    const hex = uuid.replace(/-/g, ''); // 32 chars
    const first5 = hex.slice(0, 5);
    const rest = hex.slice(5); // 27 chars

    // 27 hex → 108 bits → 18 base64 chars
    let bits = '';
    for (const ch of rest) {
        bits += parseInt(ch, 16).toString(2).padStart(4, '0');
    }
    let b64 = '';
    for (let i = 0; i < bits.length; i += 6) {
        const chunk = bits.slice(i, i + 6).padEnd(6, '0');
        b64 += BASE64_KEYS[parseInt(chunk, 2)];
    }
    return first5 + b64; // 23 chars
}
```

**注意：** 網路上有些文章說是 22 字元格式（decode-uuid.js 中的格式），那是**不同的壓縮方式**（用於 asset bundle 的運行時載入）。場景中 `__type__` 用的是 23 字元格式。

### SubMeta UUID 處理
- 格式：`mainUuid@hash`（如 `610f8f2e-ff42-4dc8-88db-385b56e926c1@6c48a`）
- 重置時：替換 mainUuid 部分，保留 `@hash` 後綴
- 壓縮格式也會出現帶 `@` 的形式

### 替換順序很重要
- **按 UUID 長度降序排列**再替換
- 確保 `uuid@hash`（較長）先被匹配，不會被 `uuid`（較短）部分匹配錯誤替換

## 踩過的坑

### 1. 腳本 missing — 壓縮 UUID 沒有被替換
- **問題**：重置後場景中腳本 missing
- **原因**：場景的 `__type__` 用壓縮格式引用腳本，但工具只替換了原始格式
- **解法**：同時替換壓縮格式（23 字元）

### 2. 「腳本編譯失敗」不一定是語法錯誤
- **問題**：Console 顯示「腳本編譯失敗，請檢查報錯信息」
- **原因**：可能是 library 快取衝突，或外部模組引用了被重置的 UUID
- **解法**：刪除 `library/` 和 `temp/` 重新開啟專案

### 3. 外部引用會斷裂
- **問題**：資料夾外的 prefab/scene 引用了資料夾內被重置的腳本
- **這是預期行為**：工具只更新選定資料夾內的檔案
- 使用者需自行處理外部引用

### 4. TypeScript 腳本的 UUID 也需要重置
- 不要跳過 `.ts.meta` — 場景引用腳本就是用其 UUID
- 重置後必須清 library 重新匯入

## 檔案結構

```
extensions/uuid-resetter/
├── package.json
├── assets-menu.js        # 右鍵選單（onAssetMenu）
├── src/
│   ├── main.ts          # 主進程：入口、面板通訊
│   ├── resetter.ts      # 核心：掃描、映射、替換、驗證
│   ├── uuid-utils.ts    # UUID 壓縮/解壓演算法（23字元格式）
│   ├── types.ts         # 型別定義
│   └── panels/default.ts # 面板（預覽 + 確認 + 結果）
```

## 使用後必要步驟
1. 刪除 `library/` 和 `temp/`
2. 重新開啟 Cocos Creator
3. 等待資源全部重新匯入
