# Missing Reference Checker（Missing 引用檢查）

Cocos Creator 編輯器擴展插件，掃描場景或預製體中的 Missing 引用（腳本遺失、資源遺失），快速定位問題節點。

## 功能特色

- **場景掃描**：掃描當前開啟的場景，找出所有 Missing 引用
- **預製體掃描**：右鍵預製體直接檢查 Missing 引用
- **精準定位**：點擊結果列表中的節點路徑，可在層級管理器中直接定位該節點
- **分類顯示**：
  - 🔴 腳本遺失（MissingScript）— 元件對應的腳本檔案不存在
  - 🟡 資源引用遺失（Missing Asset）— 引用的 UUID 找不到對應資源
- **統計摘要**：顯示 Missing 總數與各類型分布

## 系統需求

- Cocos Creator >= 3.8.0

## 安裝方式

1. 將 `missing-reference-checker` 資料夾放入專案的 `extensions/` 目錄下
2. 在 Cocos Creator 中重新載入擴展（`擴展 → 擴展管理器 → 重新整理`）

> 插件無外部依賴，開箱即用。僅使用 Node.js 內建模組（`fs`、`path`）。

## 使用方式

### 掃描當前場景

`擴展 → Missing 引用檢查 → 掃描當前場景`

### 掃描預製體

在資源管理器中對 `.prefab` 檔案右鍵 →「檢查 Missing 引用」

## 掃描邏輯

### 場景掃描

1. 取得當前場景檔案路徑
2. 解析場景 JSON 結構，遍歷所有節點與元件
3. 檢查每個元件的 `__type__` 是否對應到有效的腳本
4. 檢查所有 `__uuid__` 引用是否指向存在的資源（透過 `.meta` 檔案驗證）
5. 收集 Missing 資訊：節點路徑、節點 UUID、Missing 類型、遺失目標

### 預製體掃描

1. 直接解析 `.prefab` 檔案的 JSON 內容
2. 與場景掃描相同的檢查邏輯
3. 支援右鍵入口快速觸發

## 結果面板

| 欄位 | 說明 |
|------|------|
| 節點路徑 | 從根到問題節點的完整路徑，點擊可定位 |
| Missing 類型 | 腳本遺失（🔴）或資源引用遺失（🟡） |
| 遺失目標 | 找不到的 UUID 或腳本類名 |

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
missing-reference-checker/
├── src/
│   ├── main.ts           # 主進程入口
│   ├── checker.ts        # 核心檢查邏輯
│   ├── scene-script.ts   # 場景腳本（場景環境執行）
│   ├── types.ts          # 型別定義
│   ├── editor.d.ts       # Editor API 型別宣告
│   └── panels/
│       └── default.ts    # 面板 UI
├── dist/                  # 編譯輸出
├── i18n/                  # 多語言
├── assets-menu.js         # 右鍵選單擴展
├── package.json           # 插件設定
└── tsconfig.json          # TypeScript 設定
```

## 注意事項

- 場景掃描需要先在編輯器中開啟場景
- 動態掛載的腳本（runtime 才 addComponent）無法透過靜態分析偵測
- 資源引用檢查依賴 `.meta` 檔案，如果 `.meta` 遭刪除可能產生誤報
