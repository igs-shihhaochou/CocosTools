---
inclusion: auto
---

# Cocos Creator 3.8.5 開發技能

## 專案概述
這是一個 Cocos Creator 3.8.5 的實用工具與插件庫專案，使用 TypeScript 進行開發。

## Git 遠端倉庫
- **GitHub**: https://github.com/igs-shihhaochou/CocosTools.git
- 上傳時推送到此倉庫

## 專案目的
本專案的核心目標是開發一系列實用的 Cocos Creator 小工具及插件，提供可重用的功能模組，提升遊戲開發效率。包括但不限於：
- 編輯器擴展工具（自定義面板、快捷操作、批次處理）
- 通用遊戲元件（UI 工具、動畫輔助、除錯工具）
- 資源管理工具（自動化處理、格式轉換）
- 開發輔助工具（效能監控、日誌系統、熱更新支援）

## 開發領域
主要開發 **H5 老虎機（Slot Machine）** 遊戲，使用 Cocos Creator 構建跨平台 HTML5 遊戲。
老虎機開發的常見需求包括：
- 滾輪（Reel）動畫與停輪控制
- 符號（Symbol）管理與替換
- 賠付線（Payline）計算與顯示
- 免費遊戲（Free Game）/ 獎勵遊戲（Bonus Game）流程
- 響應式 UI 適配多種螢幕尺寸
- 音效與動畫事件同步
- 與後端 API 通訊（下注、結果、餘額）

## 技術棧
- **遊戲引擎**: Cocos Creator 3.8.5
- **腳本語言**: TypeScript
- **引擎路徑**: `/Applications/Cocos/Creator/3.8.5/CocosCreator.app/`
- **平台**: macOS

## 專案結構
- `assets/` - 使用者資源資料夾（場景、腳本、圖片、預製體等）
- `library/` - Cocos Creator 編譯後的資源快取（UUID 為基礎的儲存）
- `.creator/` - Cocos Creator 專案設定（資源模板、預設 meta 設定）

## Cocos Creator 開發規範

### TypeScript 腳本撰寫
- 所有元件腳本需繼承 `cc.Component`
- 使用裝飾器 `@ccclass`、`@property` 來定義元件屬性
- 生命週期方法：`onLoad()`、`start()`、`update(dt)`、`onDestroy()`
- 使用 `cc.Vec3`、`cc.Quat`、`cc.Color` 等引擎內建型別

### 元件範例模板
```typescript
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ComponentName')
export class ComponentName extends Component {
    @property
    speed: number = 1.0;

    @property(Node)
    targetNode: Node | null = null;

    start() {
        // 初始化邏輯
    }

    update(deltaTime: number) {
        // 每幀更新邏輯
    }
}
```

### 資源類型對應
- **cc.Material** - 材質資源
- **cc.Prefab** - 預製體資源
- **cc.ImageAsset** - 圖片資源
- **cc.SpriteFrame** - 精靈幀（從圖片衍生的子資源，UUID 帶 `@hash` 後綴）
- **cc.AnimationClip** - 動畫片段
- **cc.AudioClip** - 音訊片段

### UUID 資源系統
- Library 中的資源以 UUID 命名，分散在以 UUID 前兩字元為名的子資料夾中
- 子資源使用 `uuid@hash.json` 格式
- `.internal-data.json` - UUID 到引擎內部資源的映射
- `.internal-dependency.json` - Shader/Effect 的依賴關係
- `.internal-info1.0.0.json` - 檔案系統路徑到 UUID 的映射

### 常用 API 模組
- `cc.director` - 場景管理與遊戲迴圈
- `cc.resources` - 動態載入 resources 資料夾中的資源
- `cc.assetManager` - 資源管理器（Bundle 管理）
- `cc.tween` - 補間動畫系統
- `cc.input` - 輸入事件系統
- `cc.physics` - 物理系統
- `cc.ui` - UI 元件

### 最佳實踐
1. 資源路徑使用 `db://assets/` 前綴來引用專案資源
2. 避免在 `update()` 中頻繁建立物件，使用物件池
3. 使用 `@property` 裝飾器讓屬性在編輯器中可視化編輯
4. 節點查找優先使用 `getComponent()` 而非 `find()`
5. 大型專案建議使用 AssetBundle 進行資源分包
6. 腳本檔案放在 `assets/scripts/` 或按功能模組分資料夾
