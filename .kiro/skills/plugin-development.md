---
inclusion: auto
---

# Cocos Creator 插件開發技能

## 插件專案說明
此專案為 Cocos Creator 實用工具與插件庫（PluginLib），專注於開發各種提升開發效率的小工具及插件。目標是打造一套可重用、模組化的工具集合，涵蓋編輯器擴展、通用遊戲元件、資源處理、除錯輔助等面向。

## 插件類型

### 1. 編輯器擴展（Editor Extension）
用於擴展 Cocos Creator 編輯器功能：
- 自定義面板（Panel）
- 自定義菜單項目
- 自定義資源導入器
- 場景編輯工具

#### 編輯器擴展結構
```
extensions/
├── my-extension/
│   ├── package.json       # 插件描述與入口
│   ├── src/
│   │   ├── main.ts       # 主進程邏輯
│   │   └── panels/       # 面板 UI
│   ├── i18n/             # 多語系
│   └── static/           # 靜態資源
```

#### package.json 範例
```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "main": "./dist/main.js",
  "description": "My custom extension",
  "editor": ">=3.8.0",
  "panels": {
    "default": {
      "title": "My Panel",
      "type": "dockable",
      "main": "./dist/panels/default.js",
      "size": { "min-width": 400, "min-height": 300 }
    }
  },
  "contributions": {
    "menu": [
      {
        "path": "Extension/My Extension",
        "label": "Open Panel",
        "message": "open-panel"
      }
    ],
    "messages": {
      "open-panel": {
        "methods": ["openPanel"]
      }
    }
  }
}
```

### 2. 遊戲插件（Game Plugin）
用於提供可重用的遊戲功能模組：
- UI 框架
- 網路通訊層
- 音效管理器
- 廣告 SDK 封裝
- 資源管理工具

#### 遊戲插件建議結構
```
assets/
├── plugins/
│   └── my-plugin/
│       ├── scripts/
│       │   ├── index.ts          # 插件入口
│       │   ├── manager/          # 管理器
│       │   └── components/       # 元件
│       ├── resources/            # 插件專屬資源
│       └── README.md             # 使用說明
```

## 開發流程

### 建立新插件
1. 在 `assets/` 下建立插件模組資料夾
2. 撰寫核心管理類（通常為 Singleton 模式）
3. 撰寫可重用的 Component
4. 提供 TypeScript 型別定義
5. 編寫使用文檔

### 單例管理器模板
```typescript
import { _decorator, Component, Node, director } from 'cc';
const { ccclass } = _decorator;

@ccclass('PluginManager')
export class PluginManager extends Component {
    private static _instance: PluginManager | null = null;

    static get instance(): PluginManager {
        if (!this._instance) {
            const node = new Node('PluginManager');
            this._instance = node.addComponent(PluginManager);
            director.addPersistRootNode(node);
        }
        return this._instance;
    }

    protected onDestroy() {
        PluginManager._instance = null;
    }
}
```

### 事件系統模板
```typescript
import { EventTarget } from 'cc';

export class PluginEventBus {
    private static _eventTarget = new EventTarget();

    static on(event: string, callback: Function, target?: any) {
        this._eventTarget.on(event, callback, target);
    }

    static off(event: string, callback: Function, target?: any) {
        this._eventTarget.off(event, callback, target);
    }

    static emit(event: string, ...args: any[]) {
        this._eventTarget.emit(event, ...args);
    }
}
```

## 注意事項
- 插件程式碼應高內聚低耦合，減少對外部的依賴
- 提供清楚的公開 API 介面
- 版本管理遵循 SemVer 規範
- 確保插件相容 Cocos Creator 3.8.x 版本
