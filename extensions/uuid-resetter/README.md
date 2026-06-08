# UUID 重置工具 (UUID Resetter)

> Cocos Creator 3.8.x 編輯器擴展，重置指定資料夾內所有資源的 UUID，並自動更新內部引用關聯。

## 使用場景

多個專案透過複製產出，交給外包或其他團隊製作後，只將 Game 資料夾複製回主專案。但資料夾內 UUID 與原專案相同，造成 UUID 衝突。使用此工具可一鍵重置整個資料夾的 UUID，避免衝突。

## 功能

- 🔄 一鍵重置資料夾內所有資源的 UUID
- 🔗 自動更新資料夾內部所有互相引用（prefab、scene、material、animation、fnt 等）
- 📝 同時替換原始 UUID 格式和壓縮 UUID 格式（`__type__` 欄位）
- 📄 自動匯出映射表（`_uuid-reset-mapping.json`）方便除錯或回溯
- ⚠️ 操作前顯示預覽資訊和不可逆警告

## 安裝方式

1. 將 `extensions/uuid-resetter/` 資料夾複製到目標專案根目錄下
2. 安裝依賴並編譯：
   ```bash
   cd extensions/uuid-resetter
   npm install
   npm run build
   ```
3. 重新啟動 Cocos Creator 或在擴展管理器中重新整理

## 使用方式

1. 在資源管理器中右鍵點擊要重置的**資料夾**
2. 選擇「🔄 重置 UUID（整個資料夾）」
3. 面板彈出，顯示預覽資訊（UUID 數量、檔案數量）
4. 確認後點擊「確認重置」
5. 完成後查看結果報告

## 重要注意事項

- ⚠️ **此操作不可逆**，建議先提交 Git
- ⚠️ 重置後需要**刪除 `library/` 和 `temp/` 資料夾**，重新開啟專案讓 Cocos 重新匯入
- ⚠️ **資料夾外部**對這些資源的引用會斷裂（工具只更新選定資料夾內的檔案）
- 映射表會自動匯出到目標資料夾下的 `_uuid-reset-mapping.json`

## UUID 壓縮格式

Cocos Creator 3.x 場景中的腳本引用（`__type__` 欄位）使用 23 字元的壓縮格式：
- 前 5 個 hex 字元直接保留
- 剩餘 27 個 hex 字元編碼為 18 個 Base64 字元

本工具同時處理原始格式（36 字元）和壓縮格式（23 字元）的替換。

## 相容性

- Cocos Creator >= 3.8.0
- macOS / Windows
- 無外部依賴

## 專案結構

```
extensions/uuid-resetter/
├── package.json
├── tsconfig.json
├── assets-menu.js        # 右鍵選單
├── README.md
├── src/
│   ├── main.ts          # 主進程
│   ├── resetter.ts      # 核心重置邏輯
│   ├── uuid-utils.ts    # UUID 壓縮/解壓演算法
│   ├── types.ts         # 型別定義
│   ├── editor.d.ts      # Editor 型別宣告
│   └── panels/
│       └── default.ts   # 面板 UI
├── dist/
└── i18n/
```

## 開發

```bash
npm install
npm run build
npm run watch  # 監聽模式
```
