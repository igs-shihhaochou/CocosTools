# SlotModule

Cocos Creator 3.8.x Slot 遊戲共用基礎模組。被 50+ 款 Slot 遊戲(Slot_Client_*)以 git submodule 共用。任何改動的 break 半徑都是 50 款遊戲,務必先讀完本文件再下手。

## 目錄

- [架構](#架構)
- [新遊戲整合流程](#新遊戲整合流程)
- [Hook / Extension API — 優先使用](#hook--extension-api--優先使用)
  - [MainGameHost](#maingamehost)
  - [SpecialGameAgent](#specialgameagent)
  - [FGBase](#fgbase)
  - [WheelsBlockManager](#wheelsblockmanager)
  - [WheelMaskController](#wheelmaskcontroller)
  - [AwardController](#awardcontroller)
  - [Wheel](#wheel)
  - [WheelBlockController](#wheelblockcontroller)
  - [SymbolShowPrefabController](#symbolshowprefabcontroller)
- [⚠️ 反 Pattern:不要再這樣寫](#️-反-pattern不要再這樣寫)
- [檔案行數標準](#檔案行數標準)
- [近期重構摘要](#近期重構摘要)
- [注意事項](#注意事項)

---

## 架構

| 類別 | 職責 |
|------|------|
| MainGameHost | MainGame 狀態機與流程控制 (ProcessStart → ReadyToSpin → Spin → WaitForSpinRequestCallBack → WaitForWheelStop → WheelsAllStopped → ShowAward → AfterShowAward → ProcessFinish) |
| SpecialGameAgent | FreeGame / FeatureGame / JpGame 等特殊遊戲的進入 / 退出 / Recovery 仲介 |
| SpecialGameBase / FGBase | 特殊遊戲基底類別。FGBase 是 FreeGame 用的 thin facade |
| WheelsBlockManager | 多滾輪盤管理 |
| WheelBlockController | 單個滾輪盤(由多個 Wheel 組成) |
| Wheel | 單個滾輪 |
| SymbolShowPrefabController | Symbol 動畫 Prefab 表演(停輪、StopLoop、Bingo 等) |
| WheelMaskController | 中獎遮罩(預設用 sprite mask,可換 color darkening) |
| AwardController | 報獎流程(WinEffect / Bingo Frame / SpSymbol 表演) |
| MainGameFlowExtension | 抽象 Component 基底,讓遊戲不必 extends MainGameHost |
| SpecialGameAgentFlowExtension | 同上,讓遊戲不必 extends SpecialGameAgent |

---

## 新遊戲整合流程

### 步驟 1:場景掛 base Component(不要 extends)

```
MainGameHost (Component)             ← 直接掛 SlotModule 的 MainGameHost
├── SpecialGameAgent                  ← 直接掛 SlotModule 的 SpecialGameAgent
├── WheelsBlockManager
├── AwardController
└── G???MainGameFlow                  ← 你寫的 extension(extends MainGameFlowExtension)
```

### 步驟 2:寫 Game-side controller / FlowExtension

- **流程注入**:寫一個 `extends MainGameFlowExtension` 的 Component,override `onBeforeShowAward` / `onBeforeAfterShowAward` 等 hook
- **特殊遊戲注入**:寫一個 `extends SpecialGameAgentFlowExtension` 的 Component(若需要)
- **FreeGame**:寫 `<GameID>FreeGame extends FGBase`(這個是允許的,FGBase 設計就是要被特殊遊戲類繼承)

### 步驟 3:確認沒 extends 共用 Component

```bash
grep -rn "extends MainGameHost\|extends SpecialGameAgent\|extends WheelsBlockManager\|extends AwardController" assets/Game
```

應該為空。新遊戲一律使用 Flow Extension Component pattern,不再 extends 任何共用 Component。

---

## Hook / Extension API — 優先使用

### MainGameHost

#### Async Delegates(同節點/任何 Component 可掛)

| Delegate | 觸發時機 | 自動暫停狀態機 |
|----------|----------|----------------|
| `eventBeforeShowAward` | showAward 啟動 AwardController 之前 | ✓(僅 listener 存在時) |
| `eventBeforeAfterShowAward` | afterShowAward 進入 SG 檢查之前 | ✓ |
| `eventBeforeSpin` | spin 啟動 wheelsManager 之前 | ✓ |
| `eventBeforeReadyToSpin` | readyToSpin 之前 | ✓ |

Listener 可以是 `() => Promise<void>`。多 listener 並行 await(`Promise.all`)。

#### MainGameFlowExtension — 推薦做法

```typescript
import {MainGameFlowExtension} from 'db://assets/SlotModule/Host/MainGameFlowExtension';

@ccclass('G123MainGameFlow')
export class G123MainGameFlow extends MainGameFlowExtension {
  @property(G123Controller)
  controller: G123Controller = null;

  protected async onBeforeShowAward(): Promise<void> {
    await this.controller.checkGoldCollect();
  }

  protected async onBeforeAfterShowAward(): Promise<void> {
    await this.controller.checkGoldSend();
  }
}
```

Base class 在 `onLoad` 自動 insert,`onDestroy` 自動 remove。`@property host` 留空時自動從 `SlotGameMediator.instance.mainGameHost` 取得。

#### `runWithProcessPaused(asyncFn)` — 取代手寫 setStopProcess pair

```typescript
// ❌ 舊樣板
mainGameHost.setStopProcess(true);
await this.playAnim();
mainGameHost.setStopProcess(false);

// ✓ 新做法
await mainGameHost.runWithProcessPaused(async () => {
  await this.playAnim();
});
```

嵌套呼叫安全(內層完成不會提前釋放外層 pause);fn 拋例外時 finally 會釋放 pause。

#### `setProcessQueueFromStatus(GameStatus)`

取代手寫自訂 process queue + `@ts-ignore` 戳 private statusQueue:

```typescript
// 從 AfterShowAward 起跑
mainGameHost.setProcessQueueFromStatus(GameStatus.AfterShowAward);
```

---

### SpecialGameAgent

#### `customSetRecoveryHandler` — 取代 override setRecovery

```typescript
agent.customSetRecoveryHandler = (data) => {
  if (
    data.sgState === SpecialGameState.INIT &&
    data.specialGameJsonData?.['sg_map']?.['last_sg_id']
  ) {
    const lastSgId = data.specialGameJsonData['sg_map']['last_sg_id'];
    const remote = agent.findSpecialGameRemoteByID(lastSgId);
    if (!remote) return undefined; // fallback to default

    agent.setRecoveryFlags(true, false);
    remote.enterSpecialGameRecovery();
    agent.pushSpecialGameID(lastSgId);
    agent.setRequest(recoveryData);
    return remote.enterType;
  }
  return undefined; // 走預設流程
};
```

回傳非 undefined 表示「已處理」,直接以該值返回;回傳 undefined 走預設邏輯。

#### 公開 helper API — 取代 @ts-ignore 戳 private 欄位

| API | 用途 |
|-----|------|
| `findSpecialGameRemoteByID(id)` | 找對應的 SpecialGameBase |
| `getSpecialGameList()` | 讀 specialGameList(回傳新陣列,免外部 mutate) |
| `pushSpecialGameID(id)` | 加入 specialGameList |
| `removeSpecialGameID(id)` | 從 specialGameList 移除 |
| `getGameMap()` | 讀目前 gameMap |
| `setRecoveryFlags(isRecovery, isHaveFirstEnterSymbol)` | 設旗標 |

#### After-event Delegates

| Delegate | 觸發時機 |
|----------|----------|
| `eventAfterSetRecovery` | setRecovery 完成後(自訂或預設皆觸發) |
| `eventAfterProcessExecutingRemote` | processExecutingRemote 後(可加跨 SG 跳轉檢查) |
| `eventAfterFinished` | finished 後(可補 cleanup) |

#### SpecialGameAgentFlowExtension — 推薦做法

```typescript
@ccclass('G123SpecialGameFlow')
export class G123SpecialGameFlow extends SpecialGameAgentFlowExtension {
  protected shouldHandleCustomSetRecovery(): boolean {
    return true;
  }

  protected handleCustomSetRecovery(
    data: GameStatusArgs
  ): SpecialGameEnterTiming | undefined {
    // 自訂邏輯,return undefined 走預設
  }

  protected onAfterFinished(remote: SpecialGameBase): void {
    // 補 cleanup
  }
}
```

---

### FGBase

| Helper | 取代的樣板 |
|--------|----------|
| `registerStateNodes(nodes)` | 各遊戲 `start()` 中重複的 FSM addState 迴圈 |
| `playFreeGameBgmOnce(playFn)` | `firstIn` 旗標 + `PlayBGM` 樣板 |
| `prepareEnterSpecialGameOpeningState()` | enterSpecialGameOpening 起手的 `isExecuting=true` / `sendCommand(null)` 樣板 |

```typescript
@ccclass
export default class G123FreeGame extends FGBase {
  @property([Node])
  public states: Node[] = [];

  protected start(): void {
    this.registerStateNodes(this.states); // 取代手寫迴圈
  }

  public async enterSpecialGameOpening() {
    this.prepareEnterSpecialGameOpeningState(); // 取代起手板
  }

  public onOpeningFinished() {
    this.playFreeGameBgmOnce(() => G123Audio.playFreeGameBGM());
    this.toStartGame();
  }
}
```

---

### WheelsBlockManager

#### 多 block 預設支援

`spin()` 已內建多 block 支援(以 `spinIndex===0 + activeOnStart` 條件迭代),不再需要子類覆寫整個 `spin()`。

#### Hooks

| Hook | 用途 |
|------|------|
| `onBeforeSpin()` | spin 前的子類動作 |
| `canSpinItem(item)` | 過濾哪些 block 要 spin |
| `onStartGameDataReceived()` | SlotGDK.receiveStartGame 自動 dispatch |
| `onSpinResultReceived()` | SlotGDK.receiveSpinData 自動 dispatch |
| `onBetChanged()` | SlotGDK.eventClickChangeBet 自動 dispatch |

最後三個 hook 是 onLoad 內自動 insert / onDestroy 自動 remove,子類不必再手寫 `setEvents(true/false)` 樣板。

---

### WheelMaskController

```typescript
// ❌ 舊做法 — 整支重寫 showMask / hideMask
public showMask(row, col) { /* 50 行 color darkening 邏輯 */ }
public hideMask(row, col) { /* 50 行 */ }

// ✓ 新做法 — 只蓋兩個 hook
protected applyMaskVisual(row: number, col: number): void {
  // color darkening 邏輯
}
protected removeMaskVisual(row: number, col: number): void {
  // restore color
}
```

預設行為仍是 sprite mask,沒覆寫 hook 的遊戲不受影響。

---

### AwardController

`spSymbolWinProcess()` 拆成 4 個 hook,子類選擇要動哪部分即可:

| Hook | 預設行為 | 何時 override |
|------|---------|--------------|
| `notifyScatterWin()` | scatter win 通知 + totalWin + showWinNumAni | 想自訂報獎節奏 |
| `showSpSymbolBingoUI()` | bingo frame 顯示 | 想自訂或跳過 SP symbol bingo UI |
| `autoCleanupSpSymbolUI()` | `if (!needBingoAlarm)` cleanup | 想客製 cleanup 條件 |
| `getSpSymbolWaitTime()` | 回傳 2 秒 | 想加快或拉長等待 |

---

### Wheel

| API | 用途 |
|-----|------|
| `setRotationSpeed(speed)` | 動態調整旋轉速度(原本三個 field 全 protected,沒 public 入口) |
| `setInitRotateSpeed(speed)` | 動態調整初始速度 |
| `setRotateAddForce(force)` | 動態調整加速度 |
| `onRotateSpeedChanged()` (hook) | 速度變動時的子類 callback |

---

### WheelBlockController

#### `forEachSymbol(callback, options)` — 取代手寫雙迴圈

```typescript
// ❌ 舊樣板
for (let i = 0; i < this.wheelAry.length; i++) {
  const wheel = this.wheelAry[i];
  for (let j = wheel.outOfTopSymbolAmount;
       j < wheel.outOfTopSymbolAmount + wheel.visibleSymbolAmount;
       j++) {
    const symbol = wheel.symbolAry[j];
    if (!symbol?.symbolInfo) continue;
    // ...
  }
}

// ✓ 新做法
this.forEachSymbol(
  (wheelIndex, sortedIndex, symbol) => {
    // ...
  },
  {includeOutOfTop: false, includeOutOfBottom: false} // 預設只迭代可見
);
```

---

### SymbolShowPrefabController

新增 `onSymbolStopAnimSpawned(wheelIndex, sortedIndex, symbolEx)` hook,在 `spawnWheelStopAnimaPrefab` 迴圈中對每個 spawned symbol 觸發。子類可在此掛動畫狀態判斷,免覆寫整支 `spawnWheelStopAnimaPrefab`。

---

## ⚠️ 反 Pattern:不要再這樣寫

### ❌ extends MainGameHost / SpecialGameAgent / WheelsBlockManager 等共用 Component

**理由**:這些類別的場景序列化會把 @property 鎖在子類 schema,跨遊戲遷移困難,且 95% 的 override 需求已被 hook + Delegate 涵蓋。

```typescript
// ❌ 不要
export class GxxxMainGameHost extends MainGameHost {
  public async showAward() {
    await this.doStuff();
    super.showAward();
  }
}

// ✓ 改用
@ccclass('GxxxMainGameFlow')
export class GxxxMainGameFlow extends MainGameFlowExtension {
  protected async onBeforeShowAward(): Promise<void> {
    await this.doStuff();
  }
}
```

### ❌ @ts-ignore 戳 private 欄位

```typescript
// ❌ 不要
//@ts-ignore
const remote = agent.specialGameRemoteList.find(r => r.specialGameID === id);
//@ts-ignore
agent.specialGameList.push(id);

// ✓ 改用公開 helper
const remote = agent.findSpecialGameRemoteByID(id);
agent.pushSpecialGameID(id);
```

如果你想戳的欄位沒被公開暴露,先檢查是否有對應 helper;沒有的話**開 issue**,不要私自 cast。

### ❌ 手寫 setStopProcess(true)/(false) 成對暫停

```typescript
// ❌
mainGameHost.setStopProcess(true);
await this.playAnim();
mainGameHost.setStopProcess(false);

// ✓ runWithProcessPaused
await mainGameHost.runWithProcessPaused(() => this.playAnim());

// ✓ 或讓 onBeforeXxx hook 自動處理(SlotModule 會在 listener 存在時自動 wrap)
```

### ❌ override 整支 method 只為了改一兩行

先看父類有沒有對應 protected hook(例如 `onBeforeShowAward` / `applyMaskVisual` / `notifyScatterWin` / `getSpSymbolWaitTime`),有就 override hook,沒有再考慮整支 override。

### ❌ Cocos `@ccclass` 內單檔超過 700 行(MAJOR)/ 1000 行(BLOCKER)

**新標準(R-COMP-001)**: < 700 通過 / 700–999 MAJOR / ≥ 1000 BLOCKER。
舊 500 行門檻已棄用 — 過嚴會逼人為了壓行數把 boilerplate(forwarding getter / 1 行 wrapper / 純常數)抽到子檔,反而增加序列化耦合(Cocos @ccclass nested refs 路徑對不齊容易連爆 runtime bug)。

超過 700 行時抽 helper module 的標準作法:

- **純 args / data class**:搬到子目錄(例 `Define/Args/`),主檔 re-export 全部 symbol
- **@ccclass 內的 method body**:抽 `<Name>Helper.ts`,module-level function 取 instance 為第一個參數;class 內保留 1 行 wrapper(讓 Delegate.insert(callback, owner) 的 callback identity 還在)
- **私有欄位若 helper 需存取**:promote 為 public(@property 名稱不可改,以免破壞 scene 序列化)
- **subclass override 時若父類欄位升級可見度**:子類 override 也要同步 widening,否則 TS2415 會擋編譯

範例可參考 `Host/MainGameHostFlow.ts` / `Host/MainGameHostServer.ts` / `Wheel/WheelRotation.ts` / `Award/AwardBingoFrame.ts` / `Wheel/WheelBlockStop.ts` 等。

---

## 檔案行數標準

新規則 R-COMP-001:< 700 通過 / 700–999 MAJOR / ≥ 1000 BLOCKER。

### ✅ 通過(< 700)

| 檔案 | 行數 |
|------|------|
| Define/SlotGameData.ts | 319 |
| JP/InGameJpController.ts | 296 |
| Network/Application/RemoteServerController.ts | 417 |
| Wheel/DropSymbolPrefabController.ts | 434 |
| Host/MainGameHost.ts | 623 |
| Wheel/Wheel.ts | 627 |
| Award/AwardController.ts | 605 |
| Wheel/DropModule.ts | 672 |
| Wheel/WheelBlockController.ts | 699 |
| Define/SlotGDK.ts | 663 |
| SpecialGame/SpecialGameAgent.ts | 649 |
| Network/Application/CmdSender.ts | 630 |

### 🔴 BLOCKER(≥ 1000) — 待處理

| 檔案 | 行數 | 模式 |
|------|------|------|
| Wheel/SymbolShowPrefabController.ts | 1513 | 抽 prefab 動畫 helper(spawnWheelStopAnimaPrefab 215 行為主目標) |

下一輪重構優先處理。模式同 `MainGameHostFlow.ts` / `WheelBlockStop.ts` 的拆檔做法。

---

## 近期重構摘要

Branch:`feature/refactor-game-overrides`(已 push 到 origin 同名分支)。

### A. 加 Hook / Extension API(讓遊戲不必子類化)

| Commit | 變更 |
|--------|------|
| `04646eb` | WheelMaskController 加 applyMaskVisual / removeMaskVisual hook |
| `1addea6` | AwardController.spSymbolWinProcess 拆 4 個 hook |
| `cfff04f` | WheelsBlockManager.spin() 多 block 支援 + onBeforeSpin / canSpinItem hook |
| `e6f92d9` | SymbolShowPrefabController + WheelsBlockManager 加事件 hook |
| `4de0648` | Wheel 加 setRotationSpeed API + WheelBlockController.forEachSymbol |
| `27fc6d5` | FGBase 加 3 helper + MainGameHost.runWithProcessPaused + 3 protected async hook |
| `5aabd48` | MainGameHost 公開 4 async Delegate + MainGameFlowExtension;SpecialGameAgent 加 customSetRecoveryHandler + 6 helper + SpecialGameAgentFlowExtension |

### B. 行數拆檔(不改外部 API)

| Commit | 變更 |
|--------|------|
| `5451601` | SlotGameData.ts 938 → 323;搬至 Define/Args/ |
| `68dd8ce` | MainGameHost.ts 1093 → 941;抽 ActivityModule 至 MainGameHostActivity |
| `e0d8c0f` | MainGameHost.ts 941 → 894;抽 BGM 至 MainGameHostBgm |
| `5de32cb` | InGameJpController.ts 517 → 301;5 個 @ccclass 抽至 JpItems |
| `befc039` | RemoteServerController.ts 542 → 417;namespace 抽至 NetworkProtocol |
| `77d09a2` | DropSymbolPrefabController.ts 546 → 436;3 個 helper class 抽至 DropSymbolPrefabItems |
| `36f7f19` | MainGameHost.ts 922 → 623;抽 MainGameHostFlow + MainGameHostServer |
| `c60edb9` | Wheel.ts 886 → 627;抽 WheelRotation |
| `535bf71` | AwardController.ts 939 → 605;抽 AwardBingoFrame + AwardStateMachine |
| `6709ed9` | DropModule.ts 951 → 672;抽 DropModuleDroping + DropModuleParse |
| `19f7bad` | WheelBlockController.ts 1194 → 699;抽 WheelBlockStop + WheelBlockSpin |

### C. Bug fix

| Commit | 修了什麼 |
|--------|---------|
| `1ef8e0c` | 修 spin/showAward/afterShowAward 在無 listener 時仍 setStopProcess(true→false) → 提前觸發 nextProcess() → 跟 method 結尾顯式 nextProcess() 疊加,造成單次推進兩格的狀態機 bug。修法:比照 `readyToSpin` 已有的 gate,只有 listener 存在時才 wrap `runWithProcessPaused`。 |
| `8bc2672` | SpecialGameAgentFlowExtension.onDestroy 比對 reference 不對(同名 method 但是不同實例的 binding),會 leak listener。改用預先 bind 過的同一個 reference 給 insert / remove 用。 |
| `b91a5cb` | runWithProcessPaused 改直接寫 `isStopProcess = true/false` flag,不走 setStopProcess() 公開 API。原本走公開 API 在 finally 釋放時會額外觸發一次 nextProcess(),造成進場 onLoad → 一連串 hook → finally 釋放 → 自動 spin 的 race。 |
| `f894653` | SymbolShowPrefabFunctions.playAnimation 加 export(原本是 module-level const,遊戲端 ProcessFunc / Override 拿不到)。 |

### D. 文件 / 後勤

| Commit | 變更 |
|--------|------|
| `bc558ad` | 加本份 README,把 Hook/Extension API + 反 Pattern + 重構摘要寫成可查的文件 |
| `bcaea08` | 補 MainGameFlowExtension / SpecialGameAgentFlowExtension 的 .meta |
| `cfae61d` | 補幾個漏掉的 .meta(scene 反序列化用) |

---

## 拆檔 pattern 通則

每個 helper module 採用相同 pattern(可循):

1. helper 取 `host: ParentClass` 作為第一個參數,以 `host.field` / `host.method()` 存取狀態
2. class 保留 method shell(1 行委派),不改外部 API、@property、scene 序列化、繼承關係
3. promote private/protected 欄位升 public(僅可見度放寬,subclass 仍可 access)
4. promote protected 方法升 public(供 helper 在 module-level 呼叫)
5. 個別遊戲端 override 該方法的 visibility 也要同步 widening(否則 TS2415 擋編譯)
6. **不改** @property 名稱(以免破壞 scene 序列化 binding key)

---

## 注意事項

1. **新遊戲一律使用 Flow Extension Component pattern**,**禁止 extends MainGameHost / SpecialGameAgent / WheelsBlockManager / AwardController** 等共用 Component。
2. **CommonModule 改動風險高**:Delegate / NumberAnimation / EventManager / PlatformData 等基礎類別被 50 款共用,改它們的 break 半徑很大。改之前先評估能不能在 SlotModule 端解決。
3. **Pre-existing TSC errors**:repo 目前 baseline 有約 460 個 TS errors(主要是 ActivityModule 型別不全 / `PlatformData.pauseRefreshBalance` 等)。提交前確認 error 數沒增加即可。
4. **49 款其他遊戲不可預期跟改**:任何 SlotModule 改動必須完全向後相容。@property 序列化 key 不可改;protected → public 是放寬可見度可接受,public → protected 是降級不可接受;abstract method 簽章不可變。
5. **Smoke test 推薦遊戲**:合 PR 前在 QinShiHuang2 + FortuneArrow + BuddhaSpinLegi + LilGreen 等 override 較複雜的遊戲實際走一輪 Spin / FreeGame / Recovery 流程。
6. **review agent**:大型 refactor 前先用 review agent 對照 `~/Desktop/upgrade388/Games/` 下 50 款遊戲的 override 檔,確認改動沒踩到任何 game-side import。
