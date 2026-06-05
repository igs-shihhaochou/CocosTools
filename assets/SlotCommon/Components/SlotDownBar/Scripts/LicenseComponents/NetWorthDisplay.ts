import {
  SpecialGameState,
  SpecialSpinType,
} from './../../../../../SlotModule/Define/SlotGameData';
import {_decorator, Component} from 'cc';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import {NumberAnimation} from 'db://assets/CommonModule/Script/UIComponent/NumberAnimation';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
const {ccclass, property} = _decorator;

const numberCalculate = (num1: number, num2: number, symbol: string) => {
  const str1 = num1.toString(),
    str2 = num2.toString();
  let result, str1Length, str2Length;
  try {
    //获取小数点后的精度
    str1Length = str1.split('.')[1].length;
  } catch (error) {
    //解决整数没有小数点方法
    str1Length = 0;
  }
  try {
    str2Length = str2.split('.')[1].length;
  } catch (error) {
    str2Length = 0;
  }
  // 取两个数的最小精度，即小数点后数字的最大长度
  const maxLen = Math.max(str1Length, str2Length);
  // step将两个数都转化为整数至少小数点后移多少位
  const step = Math.pow(10, maxLen);
  switch (symbol) {
    case '+':
      // toFixed()根据最小精度截取运算结果
      result = ((num1 * step + num2 * step) / step).toFixed(maxLen);
      break;
    case '-':
      result = ((num1 * step - num2 * step) / step).toFixed(maxLen);
      break;
    case '*':
      result = ((num1 * step * (num2 * step)) / step / step).toFixed(maxLen);
      break;
    case '/':
      result = ((num1 * step) / (num2 * step)).toFixed(maxLen);
      break;
    default:
      break;
  }
  // 由于toFixed方法返回结果是字符串，还需要转回number输出
  return Number(result);
};

@ccclass('NetWorthDisplay')
export default class NetWorthDisplay extends Component {
  @property(NumberAnimation)
  private display: NumberAnimation = null;
  private currentNetWorth = 0;
  protected onLoad(): void {
    SlotGDK.instance.eventSceneIsReady.insert(this.onSceneIsReady, this);
  }
  protected onDestroy(): void {
    SlotGDK.instance.eventSceneIsReady.remove(this.onSceneIsReady, this);
    SlotGDK.instance.receiveSpinData.remove(this.onSpinDataReturn, this);
    SlotGDK.instance.eventTriggerSpecialSpin.remove(
      this.onBonusSpinReturn,
      this
    );
    SlotGDK.instance.receiveFeverData.remove(this.onFeverDataReturn, this);
    SlotGDK.instance.eventSpin.remove(this.onSpin, this);
    SlotGDK.instance.eventReadyToSpin.remove(this.updateNetWorth, this);
    SlotGDK.instance.eventShowThisWin.remove(this.updateNetWorth, this);
  }
  private onSpin() {
    if (!SlotGDK.instance.isFreeSpin) {
      this.currentNetWorth = numberCalculate(
        this.currentNetWorth,
        PlatformData.instance.currentTotalBet,
        '-'
      );
    }
  }
  private onSceneIsReady() {
    if (!PlatformData.licenseSetting.showNetWin) {
      this.node.active = false;
      return;
    }
    SlotGDK.instance.receiveSpinData.insert(this.onSpinDataReturn, this);
    SlotGDK.instance.eventTriggerSpecialSpin.insert(
      this.onBonusSpinReturn,
      this
    );
    SlotGDK.instance.receiveFeverData.insert(this.onFeverDataReturn, this);
    SlotGDK.instance.eventSpin.insert(this.onSpin, this);
    SlotGDK.instance.eventReadyToSpin.insert(this.updateNetWorth, this);
    SlotGDK.instance.eventShowThisWin.insert(this.updateNetWorth, this);
  }

  private onSpinDataReturn(data) {
    if (data.hasOwnProperty('data') && !SlotGDK.instance.isFreeSpin) {
      const spinJsonData = data['data'];
      if (spinJsonData.hasOwnProperty('this_win_amount')) {
        this.currentNetWorth = numberCalculate(
          this.currentNetWorth,
          spinJsonData['this_win_amount'],
          '+'
        );
      }
    }
  }
  private onBonusSpinReturn(type, data, cost) {
    if (type === SpecialSpinType.BUYBONUS && data) {
      if (cost && cost !== 0) {
        cost -= PlatformData.instance.currentTotalBet; //因spin會先扣一手
        this.currentNetWorth = numberCalculate(this.currentNetWorth, cost, '-');
        this.updateNetWorth();
      }
    }
  }

  private onFeverDataReturn(data) {
    if (data.hasOwnProperty('data') && !SlotGDK.instance.isFreeSpin) {
      if (data['data']) {
        const jsData = data['data'];
        const _specialGameState: SpecialGameState = jsData['sg_state'];
        if (jsData.hasOwnProperty('this_win_amount')) {
          this.currentNetWorth = numberCalculate(
            this.currentNetWorth,
            jsData['this_win_amount'],
            '+'
          );
        }
      }
    }
  }

  private onWinPlatformJp() {}
  private updateNetWorth() {
    this.display.setCurrentNumber(this.currentNetWorth);
    PlatformData.instance.currentNetWorth = this.currentNetWorth;
  }
}
