import {
  _decorator,
  Component,
  Prefab,
  Label,
  instantiate,
  Button,
  director,
  type EditBox,
  Node,
  KeyCode,
  input,
  Input,
  profiler,
  CCBoolean,
  Toggle,
} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {SlotGDK} from '../Define/SlotGDK';
import {MachineHost} from '../Host/MachineHost';
import {waitForSeconds} from '../../CommonModule/Script/ExtraType';
import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import {DEBUG, EDITOR} from 'cc/env';
import SoundManager from '../../CommonModule/Script/Manager/SoundManager';

const {ccclass, property} = _decorator;

@ccclass('CheatKeySetting')
export class CheatKeySetting {
  @property({displayName: 'UseSequence'})
  public useSequence = false;

  @property({
    displayName: 'CheatKeySequence(example: 1,2,3)',
    visible: function (this: CheatKeySetting) {
      return this.useSequence;
    },
  })
  public cheatKeySequence = '';

  @property({
    displayName: 'CheatKey',
    visible: function (this: CheatKeySetting) {
      return !this.useSequence;
    },
  })
  public cheatKey = 0;

  @property({displayName: 'CheatKeyName'})
  public cheatKeyName = '';
}

@ccclass
export class CheatKey extends Component {
  @property({type: Node, displayName: '最上層節點'})
  private root: Node = null;

  @property(Node)
  private chetKeyBtn: Node = null;

  @property({type: Node, displayName: 'ScrollView Content 節點'})
  private content: Node = null;

  @property({type: Node, displayName: 'ScrollView 父節點'})
  private scrollView: Node = null;

  @property({type: Prefab, displayName: '按鈕 Prefab'})
  private cheatKeyPrefab: Prefab = null;

  @property(Label)
  private editBoxInput: Label = null;

  @property(CheatKeySetting)
  private cheatKeyList: CheatKeySetting[] = [];

  @property({displayName: '開啟開發工具'})
  private devTool = false;

  @property(CCBoolean)
  private showProfiler = true;

  @property({
    displayName: 'Cheat Key 字串',
    visible: function (this: CheatKey) {
      return this.devTool;
    },
  })
  private cheatKeyStr = '';

  @property({
    displayName: '讀取字串',
    visible: function (this: CheatKey) {
      return this.devTool;
    },
  })
  private get setCheatKey(): boolean {
    return false;
  }
  private set setCheatKey(value: boolean) {
    if (this.cheatKeyStr !== '') {
      if (this.cheatKeyStr[this.cheatKeyStr.length - 1] === ';') {
        this.cheatKeyStr = this.cheatKeyStr.slice(0, -1);
      }
      const str: string = '{"list":' + this.cheatKeyStr + '}';
      const json = JSON.parse(str);
      (json.list as string[]).forEach((name, index) => {
        const setting: CheatKeySetting = new CheatKeySetting();
        setting.cheatKey = index;
        setting.cheatKeyName = name;
        this.cheatKeyList.push(setting);
      });
    }
  }

  private static _inst: CheatKey = null;
  public static get Instance(): CheatKey {
    return this._inst;
  }

  private _active = false;
  public set active(_active: boolean) {
    this._active = _active;
    this.root.active = _active;
    this.scrollView.active = false;
  }

  protected onLoad(): void {
    if (!PlatformData.instance.isDebugMode || !DEBUG) {
      this.node.active = false;
      this.active = false;
      profiler?.hideStats();
      return;
    }

    if (this.showProfiler && !EDITOR) {
      profiler?.showStats();
    } else {
      profiler?.hideStats();
    }

    CheatKey._inst = this;
    this.active = true;
    SlotGDK.instance.eventSpin.insert(this.resetEditBoxInput, this);
    input.on(Input.EventType.KEY_DOWN, this.toggleCheatkeyData, this);
    input.on(Input.EventType.KEY_DOWN, this.toggleProfilerData, this);

    if (this.cheatKeyList.length > 0) {
      CheatKey.Instance.set(this.cheatKeyList);
    }
    if (this.timeScaleLabel !== null) {
      this.timeScaleLabel.string = this.nowSpeed.toString();
    }

    //timeScale Set
    this.originalSetTimeout = window['setTimeout'];
    this._originTick = director.tick.bind(director);

    //timeScale Init
    this.onSpeedInit();

    //CheatKey Queue Set
    SlotGDK.instance.receiveSpinData.insert(this.setNextCheatKey, this);
    SlotGDK.instance.receiveFeverData.insert(this.setNextCheatKey, this);
  }

  protected onDestroy(): void {
    SlotGDK.instance.eventSpin.remove(this.resetEditBoxInput, this);
    SlotGDK.instance.receiveSpinData.remove(this.setNextCheatKey, this);
    SlotGDK.instance.receiveFeverData.remove(this.setNextCheatKey, this);
    CheatKey._inst = null;
    this.active = false;
  }

  public set(list: CheatKeySetting[] = null): void {
    this.content.removeAllChildren();
    const tmpLen = list.length;
    for (let i = 0; i < tmpLen; i++) {
      if (list[i].cheatKeyName === '') {
        continue;
      }
      const cheatBtn = instantiate(this.cheatKeyPrefab);
      cheatBtn.setParent(this.content);

      const clickEventHandler = new Component.EventHandler();
      clickEventHandler.target = this.node;
      clickEventHandler.component = 'CheatKey';
      clickEventHandler.handler = 'onClickCheatButton';
      if (list[i].useSequence) {
        clickEventHandler.customEventData = list[i].cheatKeySequence;
      } else {
        clickEventHandler.customEventData = list[i].cheatKey.toString();
      }
      cheatBtn.getComponent(Button).clickEvents.push(clickEventHandler);

      const cheatLabel = cheatBtn.getComponentInChildren(Label);
      cheatLabel.string = list[i].cheatKeyName;
    }
  }

  private onClickExpand() {
    console.log('[CheatKey] On Click');
    this.scrollView.active = !this.scrollView.active;
  }

  private onClickCheatButton(events, customEventData) {
    console.log('[CheatKey] On Click Cheat Key ', customEventData);
    //若customEventData為sequence，則將sequence轉換為array
    if (customEventData.includes(',')) {
      customEventData = customEventData.replaceAll(' ', '');
      customEventData = customEventData.split(',');
      //清空cheatKeyQueue
      this.clearAllCheatKeyQueue();
      this.useCheatKeyQueueToggle.isChecked = true;
      this.useCheatKeyQueue = true;
      for (let i = 0; i < customEventData.length; i++) {
        this.onClickCheatButton(null, customEventData[i]);
      }
      return;
    }
    if (this.useCheatKeyQueue) {
      if (PlatformData.instance.devmode === '') {
        PlatformData.instance.devmode = customEventData;
        if (this.nowCheatKeyLabel) {
          this.nowCheatKeyLabel.string = this.getCheatKeyName(customEventData);
        }
      } else {
        this.addCheatKeyQueue(customEventData);
      }
    } else {
      this.scrollView.active = false;
      PlatformData.instance.devmode = customEventData;
      if (this.nowCheatKeyLabel) {
        this.nowCheatKeyLabel.string = this.getCheatKeyName(customEventData);
      }
    }
  }

  private onClickClearFeature() {
    director.getScene().getComponentInChildren(MachineHost).sendClearFeature();
  }

  private toggleCheatkeyData(event) {
    if (event.keyCode === KeyCode.KEY_Q) {
      if (!this.root.active && this._active && this.showProfiler) {
        profiler?.showStats();
      } else {
        profiler?.hideStats();
      }
      this.root.active = !this.root.active && this._active;
      this.chetKeyBtn.active = !this.chetKeyBtn.active && this._active;
    }
    if (event.keyCode === KeyCode.KEY_Y) {
      const state = SoundManager.instance.getMonitorState();
      SoundManager.instance.activeMonitor(!state);
    }
  }

  // 開關Profiler
  private toggleProfilerData(event) {
    if (event.keyCode === KeyCode.KEY_Z) {
      if (this.showProfiler) {
        profiler.showStats();
      } else {
        profiler.hideStats();
      }
      this.showProfiler = !this.showProfiler;
    }
  }

  //#region 舊模組直接輸入cheat key
  private onEditingDidEnded(editbox: EditBox) {
    this.onClickCheatButton(null, editbox.textLabel.string);
    //PlatformData.instance.devmode = editbox.textLabel.string;
  }

  private resetEditBoxInput() {
    if (this.editBoxInput) this.editBoxInput.string = '';
  }
  //#endregion

  //#region 時間加速
  @property(Label)
  private timeScaleLabel: Label = null;
  @property(Node)
  private speedMouseCtrlNode: Node = null;
  private nowSpeed = 1;
  private originalSetTimeout = null;
  private _originTick = null;
  private onSpeedInit() {
    this.speedMouseCtrlNode?.on(
      Node.EventType.MOUSE_WHEEL,
      event => {
        if (event.getScrollY() > 0) {
          this.setTimeScale(null, '1');
        } else if (event.getScrollY() < 0) {
          this.setTimeScale(null, '2');
        }
      },
      this
    );
  }
  private setTimeScale(event: Event, CustomEventData) {
    switch (CustomEventData) {
      case '0':
        this.nowSpeed = 1;
        break;
      case '1':
        if (this.nowSpeed < 1) this.nowSpeed = 1;
        else this.nowSpeed += 1;
        break;
      case '2':
        if (this.nowSpeed <= 0.1) {
          this.nowSpeed = 0;
        } else if (this.nowSpeed <= 1) {
          this.nowSpeed = Math.floor((this.nowSpeed - 0.1) * 10) / 10;
        } else {
          this.nowSpeed -= 1;
        }
        break;
    }
    if (this.timeScaleLabel !== null) {
      this.timeScaleLabel.string = this.nowSpeed.toString();
    }
    const _originTick = this._originTick;
    const nowSpeed = this.nowSpeed;
    director.tick = function (dt) {
      dt *= nowSpeed;
      _originTick(dt);
    };
    //@ts-expect-error
    window['setTimeout'] = (fn: TimerHandler, duration: number) => {
      duration /= this.nowSpeed;
      return this.originalSetTimeout.apply(window, [fn, duration]);
    };
  }
  private setTimeScale2(event: Event, CustomEventData) {
    this.nowSpeed = Number(CustomEventData);
    this.setTimeScale(null, null);
  }
  //#endregion

  //#region cheatKey queue
  @property(Prefab) cheatKeyQueuePrefab: Prefab = null;
  @property(SpawnPool) cheatKeyQueuePool: SpawnPool = null;
  @property(Node) cheatKeyQueueParent: Node = null;
  @property(Toggle) useCheatKeyQueueToggle: Toggle = null;
  @property(Label) nowCheatKeyLabel: Label = null;
  private useCheatKeyQueue = false;
  private cheatKeyQueue: string[] = [];
  private cheatKeyQueueObject: Node[] = [];
  private cheatKeyQueueIndex = 1;

  private async onSetCheatKeyQueueToggle() {
    await waitForSeconds(0);
    this.useCheatKeyQueue = this.useCheatKeyQueueToggle.isChecked;
    this.clearAllCheatKeyQueue();
  }

  private onClickCancelNowCheatKey() {
    //if (this.useCheatKeyQueue === false) return;

    if (this.cheatKeyQueue.length > 0) {
      const nextCheatKey = this.cheatKeyQueue[0];
      PlatformData.instance.devmode = nextCheatKey;
      if (this.nowCheatKeyLabel) {
        this.nowCheatKeyLabel.string = this.getCheatKeyName(nextCheatKey);
      }
      this.deleteCheatKeyInQueue(0);
    } else {
      PlatformData.instance.devmode = '';
      if (this.nowCheatKeyLabel) {
        this.nowCheatKeyLabel.string = '';
      }
    }
    console.log('cheatKeyQueue:', this.cheatKeyQueue);
  }
  private setNextCheatKey() {
    if (this.useCheatKeyQueue === false) return;

    if (this.cheatKeyQueue.length > 0) {
      const nextCheatKey = this.cheatKeyQueue[0];
      PlatformData.instance.devmode = nextCheatKey;
      if (this.nowCheatKeyLabel) {
        this.nowCheatKeyLabel.string = this.getCheatKeyName(nextCheatKey);
      }
      this.deleteCheatKeyInQueue(0);
    } else {
      PlatformData.instance.devmode = '';
      if (this.nowCheatKeyLabel) {
        this.nowCheatKeyLabel.string = '';
      }
    }
    console.log('cheatKeyQueue:', this.cheatKeyQueue);
  }
  private addCheatKeyQueue(data) {
    this.cheatKeyQueue.push(data);
    this.addCheatKeyQueuePrefab(data);
  }
  private deleteCheatKeyInQueue(index) {
    const target = this.cheatKeyQueueObject[0];
    this.cheatKeyQueuePool.despawn(target);
    this.cheatKeyQueue.splice(index, 1);
    this.cheatKeyQueueObject.splice(index, 1);
  }
  private addCheatKeyQueuePrefab(data) {
    const cheatBtn = this.cheatKeyQueuePool.spawn(
      this.cheatKeyQueuePrefab.data,
      this.cheatKeyQueueParent
    );

    cheatBtn.name = this.cheatKeyQueueIndex.toString();
    const clickEventHandler = new Component.EventHandler();
    clickEventHandler.target = this.node;
    clickEventHandler.component = 'CheatKey';
    clickEventHandler.handler = 'removeCheatKeyQueuePrefab';
    clickEventHandler.customEventData = this.cheatKeyQueueIndex.toString();
    cheatBtn.getComponentInChildren(Button).clickEvents = [];
    cheatBtn.getComponentInChildren(Button).clickEvents.push(clickEventHandler);

    const cheatLabel = cheatBtn.getComponentsInChildren(Label)[0];
    cheatLabel.string = this.getCheatKeyName(data);

    this.cheatKeyQueueObject.push(cheatBtn);
    this.cheatKeyQueueIndex++;
  }
  private removeCheatKeyQueuePrefab(event: Event, CustomEventData) {
    console.log('removeCheatKeyQueuePrefab:', CustomEventData);
    const target = this.cheatKeyQueueObject.find(
      item => item.name === CustomEventData
    );
    const index = this.cheatKeyQueueObject.indexOf(target);
    this.cheatKeyQueuePool.despawn(target);
    this.cheatKeyQueueObject.splice(index, 1);
    this.cheatKeyQueue.splice(index, 1);
  }
  //#endregion

  private getCheatKeyName(cheatKey: number | string): string {
    const item = this.cheatKeyList.find(
      item => item.cheatKey.toString() === cheatKey.toString()
    );
    if (item === undefined) return cheatKey.toString();
    else return item.cheatKeyName;
  }

  private clearAllCheatKeyQueue() {
    if (this.useCheatKeyQueue === false) {
      for (let i = 0; i < this.cheatKeyQueueObject.length; i++) {
        this.cheatKeyQueuePool.despawn(this.cheatKeyQueueObject[i]);
      }
      this.cheatKeyQueue = [];
      this.cheatKeyQueueObject = [];
    }
  }
}
