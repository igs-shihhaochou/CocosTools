# Unused Resource Checker（未使用資源檢查）

Cocos Creator 編輯器擴展插件，掃描指定資料夾下未被專案引用的資源，支援批次刪除。

## 功能特色

- **精準掃描**：以 UUID 為基礎檢測資源是否被引用，支援多種 UUID 格式（完整、去 dash、Base64 壓縮）
- **Spine 引用鏈追蹤**：自動追蹤 spine-data → atlas → png 的完整引用關係
- **BMFont 引用鏈追蹤**：自動追蹤 .fnt → textureUuid → png 的引用關係
- **SubMeta 遞迴解析**：完整解析 .meta 中的巢狀 subMetas（如 SpriteFrame、Texture）
- **以檔案為單位判斷**：只要一個檔案的任何 UUID 被引用，整個檔案即視為已使用
- **右鍵選單整合**：資源管理器中對資料夾右鍵即可觸發掃描
- **點擊定位**：列表中點擊資源路徑可直接在資源管理器中定位高亮
- **批次刪除**：支援全選/取消全選，一鍵刪除未使用資源

## 系統需求

- Cocos Creator >= 3.8.0

## 安裝方式

1. 將 `unused-resource-checker` 資料夾放入專案的 `extensions/` 目錄下
2. 在 Cocos Creator 中重新載入擴展（`擴展 → 擴展管理器 → 重新整理`）

> 插件無外部依賴，開箱即用。僅使用 Node.js 內建模組（`fs`、`path`）。

## 使用方式

### 方式一：選單開啟

`擴展 → 未使用資源檢查 → 開啟面板`

### 方式二：右鍵選單

在資源管理器中對任意資料夾右鍵 →「檢查未使用資源」

## 掃描邏輯

1. 收集目標資料夾下所有資源的 UUID（含 subMetas 遞迴解析）
2. 掃描整個 `assets/` 下的引用檔案（`.scene`、`.prefab`、`.anim`、`.ts`、`.js`、`.json` 等）
3. 比對 UUID 出現情況（支援完整 UUID、去 dash、Base64 壓縮格式）
4. 追蹤 Spine 引用鏈（spine-data meta 的 `atlasUuid` → atlas 內容引用的 png）
5. 追蹤 BMFont 引用鏈（.fnt meta 的 `textureUuid` → 對應 png）
6. 以檔案為單位輸出結果，按檔案大小降序排列

## 支援的資源類型

| 類別 | 副檔名 |
|------|--------|
| 圖片 | `.png` `.jpg` `.jpeg` `.webp` `.bmp` `.gif` |
| Spine | `.skel` `.atlas` |
| 音效 | `.mp3` `.ogg` `.wav` `.m4a` |
| 預製體 | `.prefab` |
| 動畫 | `.anim` `.animation` |
| 材質/特效 | `.mtl` `.effect` |
| BMFont | `.fnt` |
| JSON | `.json` |
| 字型 | `.ttf` `.otf` |
| Plist | `.plist` |
| 3D 模型 | `.fbx` `.gltf` `.glb` |

## 開發

```bash
# 安裝開發依賴
npm install

# 編譯 TypeScript
npm run build

# 監聽模式（開發時使用）
npm run watch
```

## 專案結構

```
unused-resource-checker/
├── src/
│   ├── main.ts          # 主進程入口
│   ├── scanner.ts       # 掃描核心邏輯
│   ├── panels/
│   │   └── default.ts   # 面板 UI
│   └── editor.d.ts      # Editor API 型別宣告
├── dist/                 # 編譯輸出
├── i18n/                 # 多語言
├── assets-menu.js        # 右鍵選單擴展
├── package.json          # 插件設定
└── tsconfig.json         # TypeScript 設定
```

## 注意事項

- 刪除操作不可復原，建議操作前先透過版本控制備份
- 掃描範圍越大，耗時越長，建議以子資料夾為單位分批掃描
- 動態載入的資源（透過 `resources.load` 或 Bundle 載入）可能無法被靜態分析偵測到，請謹慎確認後再刪除
