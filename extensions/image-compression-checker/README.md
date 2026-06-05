# 圖片壓縮檢查工具 (Image Compression Checker)

> Cocos Creator 3.8.x 編輯器擴展，掃描專案圖片資源的壓縮狀態與圖集歸屬，協助優化 H5 包體大小。

## 功能

- 🔍 掃描 `assets/` 下所有圖片（PNG, JPG, WebP 等）
- 📊 檢查每張圖片是否已設定紋理壓縮（讀取 `.meta` 的 `compressSettings`）
- 📦 判斷圖片是否已被打包進圖集（Auto Atlas `.pac`）
- ⚠️ 圖片未入圖集時額外標示警告
- ⚠️ 圖集未設定壓縮時標示所屬圖片
- ✅ 批次勾選圖片，一鍵指定壓縮格式套用
- 📈 產生分類統計報告與壓縮建議

## 四種分類

| 分類 | 說明 | 優先級 |
|------|------|--------|
| 🔴 散圖未壓縮 | 未入圖集 + 未壓縮 | ⚠️ 最高 |
| 🟡 圖集未壓縮 | 已入圖集但圖集未設定壓縮 | ⚠️ 高 |
| 🔵 散圖已壓縮 | 未入圖集但已單獨壓縮 | 💡 建議入圖集 |
| 🟢 圖集已壓縮 | 已入圖集且已壓縮 | ✅ 良好 |

## 安裝方式

### 方法一：直接複製（推薦）

1. 將整個 `extensions/image-compression-checker/` 資料夾複製到目標專案的根目錄下：
   ```
   你的專案/
   ├── assets/
   ├── extensions/
   │   └── image-compression-checker/   ← 複製到這裡
   └── ...
   ```

2. 在擴展目錄下安裝依賴並編譯：
   ```bash
   cd extensions/image-compression-checker
   npm install
   npm run build
   ```

3. 重新啟動 Cocos Creator，或在「擴展 → 擴展管理器」中重新整理。

### 方法二：僅複製編譯產出

如果你不需要修改原始碼，可以只複製以下檔案：
```
extensions/image-compression-checker/
├── package.json
├── dist/           ← 編譯後的 JS
├── i18n/
└── README.md
```

## 使用方式

### 右鍵掃描指定資料夾（主要用法）
1. 在 Cocos Creator 的「資源管理器」中，右鍵點擊任意資料夾
2. 選擇「掃描圖片壓縮狀態」
3. 面板會自動開啟並只掃描該資料夾下的圖片

### 選單列掃描全專案
選單列 → 擴展 → 圖片壓縮檢查 → 開啟面板（掃描全專案）

### 快速掃描（Console 輸出）
選單列 → 擴展 → 圖片壓縮檢查 → 快速掃描（Console 輸出）
直接在 Console 中印出文字報告，不需要面板。

## 批次壓縮操作

1. 掃描完成後，在結果列表中勾選要壓縮的圖片（可用全選）
2. 在底部批次操作列選擇壓縮格式：
   - **WebP** — H5 推薦，兼顧品質與大小
   - **ETC2** — Android / WebGL2
   - **ASTC** — 高品質，Android / iOS
   - **PVRTC** — 舊 iOS 裝置
   - **PNG** — 無損壓縮
3. 選擇品質等級（快速 / 一般 / 最佳）
4. 點擊「套用壓縮設定」
5. 工具會自動修改勾選圖片的 `.meta` 檔案並重新掃描

## 面板功能

- **篩選器**：按分類（散圖未壓縮 / 圖集未壓縮...）或大小閾值篩選
- **路徑點擊**：點擊圖片路徑可在資源管理器中定位該資源
- **批次操作**：勾選多張圖片後，統一指定壓縮格式套用

## 相容性

- Cocos Creator >= 3.8.0
- macOS / Windows
- 無外部依賴（僅使用 Node.js 內建模組 `fs` / `path`）

## 專案結構

```
extensions/image-compression-checker/
├── package.json          # 插件描述與入口
├── tsconfig.json         # TypeScript 設定
├── README.md             # 本文件
├── src/                  # TypeScript 原始碼
│   ├── main.ts          # 主進程（訊息處理、掃描入口）
│   ├── scanner.ts       # 核心掃描邏輯
│   ├── reporter.ts      # 報告產生器（Console 文字報告）
│   ├── compressor.ts    # 批次壓縮設定器（修改 .meta）
│   ├── types.ts         # 型別定義
│   ├── editor.d.ts      # Editor 全域型別宣告
│   └── panels/
│       └── default.ts   # 面板 UI
├── dist/                 # 編譯產出（JS）
├── i18n/
│   ├── en.js            # 英文
│   └── zh.js            # 中文
└── node_modules/         # 開發依賴
```

## 開發

```bash
# 安裝依賴
npm install

# 編譯
npm run build

# 監聽模式（修改後自動編譯）
npm run watch
```

## 注意事項

- 批次壓縮會直接修改 `.meta` 檔案，建議先提交 git 後再操作
- Auto Atlas 的壓縮設定是在 `.pac.meta` 上，而非個別圖片
- 掃描不會修改任何檔案，只有「套用壓縮設定」才會寫入 `.meta`
