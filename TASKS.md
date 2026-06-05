# PluginLib 工具開發任務清單

---

## 工具一：圖片壓縮檢查工具（Image Compression Checker）

### 痛點描述
H5 老虎機對包體大小有嚴格限制，專案中可能存在大量未壓縮或壓縮率不佳的圖片資源。目前需要手動逐一檢查，非常耗時且容易遺漏。

### 工具目標
提供一個可跨專案使用的 Cocos Creator 編輯器擴展，能快速掃描專案內所有圖片資源，識別出未壓縮或體積過大的圖片，並提供壓縮建議或一鍵壓縮功能。

---

### Task 1：專案結構建立
- [x] 在 `assets/` 下建立插件模組資料夾結構：
  ```
  assets/
  └── image-compression-checker/
      ├── scripts/
      │   ├── ImageCompressionChecker.ts   # 核心檢查邏輯
      │   └── types.ts                     # 型別定義
      └── README.md                        # 使用說明
  ```
- [x] 建立編輯器擴展結構：
  ```
  extensions/
  └── image-compression-checker/
      ├── package.json          # 插件描述
      ├── tsconfig.json         # TypeScript 設定
      ├── src/
      │   ├── main.ts          # 主進程（掃描邏輯）
      │   └── panels/
      │       └── default.ts   # 面板 UI（結果展示）
      ├── i18n/
      │   ├── en.js
      │   └── zh.js
      └── static/              # 靜態資源（圖標等）
  ```

### Task 2：核心掃描邏輯實作
- [x] 實作圖片資源掃描器，遍歷 `assets/` 下所有圖片檔案（png, jpg, webp 等）
- [x] 讀取每張圖片的：
  - 檔案大小（原始 size）
  - 圖片尺寸（width x height）
  - 格式（PNG / JPG / WebP）
  - 是否已設定 Cocos 的紋理壓縮（查看 `.meta` 檔案中的 `platformSettings`）
  - 預估理論最佳大小（根據尺寸和格式）
- [x] 判斷圖片是否「未壓縮」的規則：
  - `.meta` 中 `platformSettings` 為空或未啟用壓縮
  - 檔案大小明顯大於同尺寸壓縮後的預期值
  - PNG 使用了不必要的 alpha 通道（純色圖片）
- [x] **圖集（Auto Atlas / SpriteAtlas）關聯判斷**：
  - 掃描專案中所有 `.pac`（Auto Atlas）及 SpriteAtlas 資源
  - 判斷每張圖片是否已被打包進某個圖集：
    - 已打包進圖集 → 檢查該圖集的 `.meta` 是否有設定紋理壓縮
    - 若圖集未壓縮 → 標記為「圖集未壓縮」，報告中顯示所屬圖集路徑
    - 未打包進任何圖集 → 標記為「散圖（未入圖集）」，作為額外警告提示
  - 讀取圖集 meta 中的壓縮設定（與單張圖片相同邏輯）
  - 支援一張圖片同時出現在多個圖集的情況

### Task 3：結果分析與報告
- [x] 產生掃描報告，包含：
  - 圖片總數、總大小
  - 未壓縮圖片清單（路徑、大小、尺寸、建議動作）
  - 依大小排序，優先顯示最大的未壓縮圖片
  - 預估壓縮後可節省的空間
- [x] **圖集相關分類報告**：
  - 分類一：散圖未壓縮（未入圖集 + 未壓縮）⚠️ 最高優先
  - 分類二：圖集未壓縮（已入圖集但圖集未設定壓縮）
  - 分類三：散圖已壓縮（未入圖集但已單獨壓縮）✓
  - 分類四：圖集已壓縮（已入圖集且圖集已壓縮）✓
  - 額外標示：未被打包進任何圖集的散圖清單（即使已壓縮也提示，因為打包圖集通常能進一步降低 draw call）
- [x] 支援篩選/排序功能：
  - 按檔案大小排序
  - 按資料夾分組
  - 按圖集歸屬分組
  - 僅顯示超過指定大小閾值的圖片（預設 > 100KB）

### Task 4：編輯器面板 UI
- [x] 建立 Cocos Creator 編輯器面板：
  - 結果列表：顯示所有未壓縮圖片
  - 每筆結果顯示：縮圖、路徑、大小、建議壓縮格式
  - 點擊項目可在 Asset 面板中定位該資源
  - 閾值設定：可自訂「大圖」的判定大小
- [x] 開啟方式：右鍵資源管理器的資料夾 → 「掃描圖片壓縮狀態」
  - 使用 `contributions.assets` 註冊右鍵選單
  - 右鍵點擊資料夾時顯示「掃描圖片壓縮狀態」選項
  - 點擊後以該資料夾為掃描根目錄，開啟面板並顯示結果
  - 同時保留頂部選單列入口（掃描整個專案）
- [x] 批次壓縮功能：
  - 每筆結果前方提供勾選框（Checkbox），可單獨勾選或全選
  - 勾選後，在面板上方或下方提供壓縮格式選擇（下拉選單）：
    - 支援格式：ETC2 / ASTC / PVRTC / WebP / PNG
  - 點擊「套用壓縮設定」按鈕，批次將勾選的圖片/圖集寫入對應的 `.meta` 壓縮設定
  - 套用完成後自動重新掃描，刷新結果列表

### Task 5：跨專案可攜性
- [x] 確保插件為獨立模組，無外部依賴
- [x] 提供安裝說明（複製 `extensions/image-compression-checker/` 到目標專案即可）
- [x] 支援 Cocos Creator 3.8.x 版本
- [x] 撰寫 README.md 包含：
  - 功能說明
  - 安裝方式
  - 使用截圖/GIF
  - 設定選項說明

### Task 6：進階功能（選做）
- [ ] 支援匯出 CSV 報告
- [ ] 支援自訂忽略清單（某些圖片不需要壓縮）
- [ ] 支援與 CI/CD 整合的命令列模式
- [ ] 圖片預覽對比（壓縮前 vs 壓縮後）

---

## 工具二：UUID 重置工具（UUID Resetter）

### 痛點描述
多個專案透過複製產出，交給外包或其他團隊製作後，只會將 Game 資料夾複製回主專案。但複製出去的資料夾內 UUID 與原專案相同，放回來時造成 UUID 衝突，導致場景、預製體、元件引用錯亂。

### 工具目標
提供一個 Cocos Creator 編輯器擴展，可在資源管理器中右鍵選擇資料夾後，一鍵重置該資料夾內所有資源的 UUID，並自動更新資料夾內部所有互相引用的關聯（確保內部關聯不斷裂）。

---

### Task 1：專案結構建立
- [ ] 建立編輯器擴展結構：
  ```
  extensions/
  └── uuid-resetter/
      ├── package.json          # 插件描述
      ├── tsconfig.json         # TypeScript 設定
      ├── assets-menu.js        # 右鍵選單註冊
      ├── src/
      │   ├── main.ts          # 主進程
      │   ├── resetter.ts      # 核心 UUID 重置邏輯
      │   ├── types.ts         # 型別定義
      │   ├── editor.d.ts      # Editor 型別宣告
      │   └── panels/
      │       └── default.ts   # 面板（進度顯示 + 結果報告）
      ├── i18n/
      │   ├── en.js
      │   └── zh.js
      └── README.md
  ```
- [ ] 在 `package.json` 中註冊：
  - 右鍵資源管理器選單（透過 `assets-menu.js`）
  - 所有面板和主進程需要的 messages

### Task 2：UUID 掃描與映射建立
- [ ] 遞迴掃描指定資料夾內所有 `.meta` 檔案
- [ ] 收集所有現有 UUID（包含主資源 UUID 和 subMeta UUID）
- [ ] 為每個舊 UUID 產生新的 UUID（使用 Cocos 相容的格式）
- [ ] 建立 `oldUUID → newUUID` 的映射表
- [ ] 處理 subMeta 的 UUID 格式（如 `uuid@6c48a`）：
  - 主 UUID 部分替換，hash 後綴保留
  - 確保 subMeta 的 key 對應關係正確

### Task 3：UUID 替換邏輯
- [ ] 更新所有 `.meta` 檔案中的 UUID：
  - 頂層 `"uuid"` 欄位
  - `subMetas` 中每個子資源的 `"uuid"` 欄位
  - `userData` 中引用到的 UUID（如 `textureUuid`、`imageUuidOrDatabaseUri`）
- [ ] 掃描並更新資料夾內所有引用到舊 UUID 的檔案：
  - `.prefab`（預製體）中的 `__uuid__` 引用
  - `.scene`（場景）中的 `__uuid__` 引用
  - `.anim` / `.animation`（動畫）中的資源引用
  - `.material`（材質）中的 `_effectAsset.__uuid__`
  - `.fnt`（字型）中的 `textureUuid`
  - `.pac.meta`（圖集）中引用到的 UUID
  - TypeScript/JavaScript 中硬編碼的 UUID 字串（可選）
- [ ] 確保只替換映射表中有的 UUID（不動外部引用）

### Task 4：關聯完整性驗證
- [ ] 替換完成後，重新掃描所有檔案
- [ ] 驗證資料夾內部的所有 UUID 引用都指向有效的新 UUID
- [ ] 列出「無法解析的引用」（可能指向資料夾外部的資源 — 這是正常的）
- [ ] 產生替換報告：
  - 總共重置了多少個 UUID
  - 總共更新了多少個引用
  - 有無失敗或未能處理的項目

### Task 5：面板 UI 與安全機制
- [ ] 右鍵選單入口：資料夾右鍵 → 「重置 UUID」
- [ ] 點擊後彈出確認對話框：
  - 顯示即將重置的資料夾路徑
  - 警告此操作不可逆（建議先提交 Git）
  - 確認 / 取消按鈕
- [ ] 執行時顯示進度：
  - 掃描進度
  - 替換進度
  - 驗證進度
- [ ] 完成後顯示結果報告
- [ ] 提供「匯出映射表」功能（JSON 格式，方便除錯或回溯）

### Task 6：邊界情況處理
- [ ] 處理 UUID 循環引用（A 引用 B，B 引用 A）
- [ ] 處理同一 UUID 被多個檔案引用的情況
- [ ] 忽略 `.meta` 以外的隱藏檔案
- [ ] 不處理資料夾外部的引用（只更新選定資料夾內的檔案）
- [ ] 支援巢狀 subMeta（如 SpriteFrame → Texture 的多層引用）

### Task 7：跨專案可攜性
- [ ] 確保插件為獨立模組，無外部依賴
- [ ] 支援 Cocos Creator 3.8.x
- [ ] 撰寫 README.md
- [ ] 提供安裝說明

---

## 優先級
| Task | 優先級 | 預估工作量 |
|------|--------|-----------|
| Task 1 | P0 | 0.5 天 |
| Task 2 | P0 | 1 天 |
| Task 3 | P0 | 2 天 |
| Task 4 | P0 | 1 天 |
| Task 5 | P1 | 1 天 |
| Task 6 | P1 | 1 天 |
| Task 7 | P1 | 0.5 天 |
