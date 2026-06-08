---
inclusion: auto
---

# 圖片壓縮檢查工具 — 開發筆記與設計決策

## 工具位置
`extensions/image-compression-checker/`

## 核心設計邏輯

### 壓縮狀態判斷規則

1. **讀取 `.meta` 中的 `userData.compressSettings`**
2. **判斷 `useCompressTexture` 是否為 `true`**
3. **驗證 `presetId` 是否存在於專案有效 Preset 列表中**

有效 Preset 來源：
- 內建：`"default"`（Default Opaque）、`"transparent"`（Default Transparent）
- 使用者自定義：`settings/v2/packages/builder.json` → `textureCompressConfig.userPreset` 的 keys

### 圖集判斷規則

- `.pac` 檔案（Auto Atlas）所在資料夾及子資料夾的圖片，視為「已入圖集」
- 已入圖集的散圖不列出，只列圖集本身（`.pac`）
- 圖集的壓縮狀態看 `.pac.meta` 的 `compressSettings`，不看散圖的

### bmFont 判斷規則

- 掃描所有 `.fnt.meta` → 收集 `userData.textureUuid`
- 圖片的 UUID 如果在 bmFont texture 列表中 → 標記為字型圖片，不列為需處理

### 掃描結果分類

| 分類 | 條件 | 預設是否顯示 |
|------|------|-------------|
| 🔴 散圖未壓縮 | 未入圖集 + 未壓縮 | ✅ 顯示 |
| 🟡 圖集未壓縮 | `.pac` 的 presetId 無效或未設定 | ✅ 顯示 |
| 🔵 散圖已壓縮 | 未入圖集 + 已壓縮 | ✅ 顯示 |
| 🟢 圖集已壓縮 | `.pac` 有有效 presetId | ❌ 隱藏 |
| 🔤 字型圖片 | 關聯到 `.fnt` | ❌ 隱藏 |

### 篩選器

- **需處理**（預設）：排除已壓縮圖集和字型圖片
- **全部**：顯示所有結果
- 各單獨分類篩選

## 面板架構

- **開啟方式**：右鍵資料夾 →「掃描圖片壓縮狀態」/ 選單列
- **面板 ↔ 主進程通訊**：面板透過輪詢 `getPendingScanFolder` 取得新掃描指令（因面板無法接收主進程 message）
- **版本號機制**：`_scanVersion` 每次右鍵遞增，面板偵測到變化就觸發掃描

## 批次壓縮

- 下拉選單從 `builder.json` 動態載入可用 Preset（內建 + 使用者自定義）
- 套用時寫入 `.meta` 的 `compressSettings = { useCompressTexture: true, presetId: "xxx" }`
- 套用後自動重新掃描刷新結果

## 檔案結構

```
extensions/image-compression-checker/
├── package.json          # messages 必須註冊所有可被呼叫的方法
├── assets-menu.js        # 右鍵選單（onAssetMenu / onDBMenu）
├── src/
│   ├── main.ts          # 主進程：掃描入口、preset 查詢、批次壓縮
│   ├── scanner.ts       # 核心掃描：圖集判斷、presetId 驗證、bmFont 排除
│   ├── compressor.ts    # 批次壓縮：寫入 presetId 到 .meta
│   ├── reporter.ts      # Console 文字報告
│   ├── types.ts         # 型別定義
│   └── panels/default.ts  # 面板 UI（@ts-nocheck）
```

## 重要路徑

- 壓縮 Preset 定義：`settings/v2/packages/builder.json` → `textureCompressConfig.userPreset`
- 圖片壓縮設定：`assets/**/*.png.meta` → `userData.compressSettings`
- 圖集壓縮設定：`assets/**/*.pac.meta` → `userData.compressSettings`
- bmFont 關聯：`assets/**/*.fnt.meta` → `userData.textureUuid`
