import {SelectButton} from '../../Common/Script/SelectButton';
import {TextBox} from '../../Common/Script/TextBox';
import {LightButton} from '../../Common/Script/LightButton';
import {Delegate} from '../../CommonModule/Script/ExtraType';
import {SpawnPool} from '../../CommonModule/Script/UIComponent/SpawnPool';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {_decorator, Component, Prefab, CCBoolean, Node, game} from 'cc';
import {setOpacity} from '../../CommonModule/Script/Utility/NodeProperty';

const {ccclass, property} = _decorator;

@ccclass
export class AutospinPopup extends Component {
  public closePopup: Delegate = new Delegate();
  public stopAutoSpin: Delegate = new Delegate();

  @property(SelectButton)
  private stopAutoinSpecialGameButton: SelectButton = null;

  @property(Node)
  private layoutRoot: Node = null;

  @property(Prefab)
  private textBox: Prefab = null;

  @property(SpawnPool)
  private spawnPool: SpawnPool = null;

  private textBoxAry: TextBox[] = [];

  private originalAutospinSetting: object = {};

  @property(LightButton)
  private fastspinLightButton: LightButton = null;

  @property(LightButton)
  private autospinLightButton: LightButton = null;

  @property(CCBoolean)
  private directAutoSpin = false;

  public onLoad() {
    this.fastspinLightButton.onClick.insert(this.OnClickFastspinButton, this);
    this.stopAutoinSpecialGameButton.onClick.insert(
      this.OnClickStopAutoinSpecialGameButton,
      this
    );
    this.autospinLightButton.onClick.insert(this.OnClickAutospinButton, this);

    this.fastspinLightButton.setLightOnOff(PlatformData.instance.fastspin);
    this.stopAutoinSpecialGameButton.SetSelection(
      PlatformData.instance.stopAutoInSpecialGame
    );
    this.autospinLightButton.setLightOnOff(PlatformData.instance.autospin);
  }

  ////初始化
  public Init(spinTimesAry: Number[]) {
    if (
      spinTimesAry === null ||
      spinTimesAry === undefined ||
      spinTimesAry.length <= 0
    )
      return;

    this.spawnPool.despawnAll();

    this.textBoxAry = [];

    ////生出Autospin的點擊框
    spinTimesAry.forEach(element => {
      const textBox: TextBox = this.spawnPool
        .spawn(this.textBox.data, this.layoutRoot)
        .getComponent<TextBox>(TextBox);
      if (element === -1) {
        textBox.setText('∞');
      } else {
        textBox.setText(element.toString());
      }

      this.textBoxAry.push(textBox);

      ////按下某一個Box的時候
      textBox.node.on(Node.EventType.TOUCH_END, () => {
        this.OnClickAutospinTimesTextBox(element);
      });
    });

    PlatformData.instance.fastspin = false;
    PlatformData.instance.autospin = false;
    this.fastspinLightButton.setLightOnOff(PlatformData.instance.fastspin);
    this.autospinLightButton.setLightOnOff(PlatformData.instance.autospin);
    this.node.active = false;
  }

  public onEnable() {
    this.OnClickAutospinTimesTextBox(0);
    this.originalAutospinSetting = {
      fastspin: PlatformData.instance.fastspin,
      stopAutoinSpecialGame: PlatformData.instance.stopAutoInSpecialGame,
      autospinTimes: PlatformData.instance.autospinTimes,
      autospin: PlatformData.instance.autospin,
    };
    if (this.directAutoSpin) {
      setOpacity(this.node, 0);
      PlatformData.instance.autospinTimes = 99999;
      PlatformData.instance.autospin = true;
      this.OnClickOK();
    } else {
      setOpacity(this.node, 255);
    }
  }

  ////按下快速旋轉按鈕
  private OnClickFastspinButton() {
    PlatformData.instance.fastspin = !PlatformData.instance.fastspin;
    // this.fastspinButton.SetSelection(GameData.Instance.fastspin);
    this.fastspinLightButton.setLightOnOff(PlatformData.instance.fastspin);
    this.OnClickOK();
  }

  ////按下快速旋轉按鈕
  private OnClickStopAutoinSpecialGameButton() {
    PlatformData.instance.stopAutoInSpecialGame =
      !PlatformData.instance.stopAutoInSpecialGame;
    this.stopAutoinSpecialGameButton.SetSelection(
      PlatformData.instance.stopAutoInSpecialGame
    );
  }

  ////按下自動旋轉按鈕
  private OnClickAutospinButton() {
    if (PlatformData.instance.autospin) {
      if (this.stopAutoSpin.length > 0) {
        this.stopAutoSpin.notify();
      }
    }
  }

  ////按下Autospin的框框
  private OnClickAutospinTimesTextBox(spinTimes: Number) {
    this.textBoxAry.forEach(element => {
      if (element.getText() === spinTimes.toString()) {
        element.setSelection(true);
      } else if (element.getText() === '∞' && spinTimes === -1) {
        element.setSelection(true);
      } else {
        element.setSelection(false);
      }
    });

    PlatformData.instance.autospinTimes = spinTimes.valueOf();
    if (spinTimes !== 0) {
      PlatformData.instance.autospin = true;
    }
  }

  private OnClickCancel(_ButtonNode: Node = null, isRecoverCursor = false) {
    if (isRecoverCursor) game.canvas.style.cursor = 'default';

    PlatformData.instance.fastspin = this.originalAutospinSetting['fastspin'];
    this.fastspinLightButton.setLightOnOff(PlatformData.instance.fastspin);

    PlatformData.instance.stopAutoInSpecialGame =
      this.originalAutospinSetting['stopAutoinSpecialGame'];
    this.stopAutoinSpecialGameButton.SetSelection(
      PlatformData.instance.stopAutoInSpecialGame
    );

    PlatformData.instance.autospinTimes =
      this.originalAutospinSetting['autospinTimes'];
    PlatformData.instance.autospin = this.originalAutospinSetting['autospin'];
    this.autospinLightButton.setLightOnOff(PlatformData.instance.autospin);

    if (this.closePopup.length > 0) {
      this.closePopup.notify(false);
    }
  }

  private OnClickOK(_ButtonNode: Node = null, isRecoverCursor = false) {
    if (isRecoverCursor) game.canvas.style.cursor = 'default';

    this.autospinLightButton.setLightOnOff(PlatformData.instance.autospin);
    if (this.closePopup.length > 0) {
      this.closePopup.notify(true);
    }
  }

  public SetAutospinLightButton() {
    this.autospinLightButton.setLightOnOff(PlatformData.instance.autospin);
  }
}
