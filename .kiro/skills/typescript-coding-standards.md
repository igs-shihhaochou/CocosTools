---
inclusion: auto
---

# TypeScript 程式碼規範（Cocos Creator）

## 命名規範
- **類名**: PascalCase（如 `PlayerController`、`UIManager`）
- **方法/函數**: camelCase（如 `getPlayerInfo()`、`onButtonClick()`）
- **變數**: camelCase（如 `playerSpeed`、`isActive`）
- **常數**: UPPER_SNAKE_CASE（如 `MAX_HEALTH`、`DEFAULT_SPEED`）
- **私有屬性**: 以底線前綴 `_`（如 `_health`、`_isAlive`）
- **介面**: 以 `I` 前綴（如 `IPlayerData`、`IConfig`）
- **列舉**: PascalCase，成員也用 PascalCase（如 `GameState.Playing`）

## 檔案結構
```typescript
// 1. 引入（Imports）
import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

// 2. 常數定義
const MAX_SPEED = 10;

// 3. 介面/型別定義
interface IPlayerConfig {
    speed: number;
    health: number;
}

// 4. 列舉
enum PlayerState {
    Idle,
    Running,
    Jumping
}

// 5. 類定義
@ccclass('PlayerController')
export class PlayerController extends Component {
    // 5a. 裝飾器屬性（編輯器可見）
    @property
    speed: number = 5;

    // 5b. 私有屬性
    private _state: PlayerState = PlayerState.Idle;
    private _velocity: Vec3 = new Vec3();

    // 5c. 生命週期方法
    onLoad() {}
    start() {}
    update(dt: number) {}
    onDestroy() {}

    // 5d. 公開方法
    public moveTo(target: Vec3) {}

    // 5e. 私有方法
    private _updateState() {}
}
```

## TypeScript 最佳實踐

### 型別安全
- 避免使用 `any`，使用具體型別或泛型
- 使用 `strictNullChecks`，明確處理 null/undefined
- 善用 Union Types 和 Type Guards

### Cocos 特定規範
- `@property` 屬性需給予預設值
- 節點引用使用 `Node | null = null` 並在使用前檢查
- 避免在 `update()` 中使用 `new` 建立物件
- 使用 `Vec3.copy()` 而非建立新的 Vec3 實例

### 錯誤處理
```typescript
// 好的做法
const comp = this.node.getComponent(MyComponent);
if (!comp) {
    console.warn('MyComponent not found on node');
    return;
}
comp.doSomething();

// 避免
this.node.getComponent(MyComponent)!.doSomething(); // 可能 crash
```

### 效能注意事項
- 快取 `getComponent()` 結果到成員變數
- 使用物件池回收頻繁建立/銷毀的物件
- `scheduleOnce` / `schedule` 優先於自行計時
- 減少每幀的 GC 壓力（避免頻繁建立臨時物件）
