import {_decorator, Component, Label} from 'cc';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import Functions from 'db://assets/CommonModule/Script/Utility/Functions';
const {ccclass, property} = _decorator;

@ccclass('CurrencyLabel')
export class CurrencyLabel extends Component {
  @property(Label)
  private label: Label = null;

  protected onLoad(): void {
    const showCurrency =
      PlatformData.currencyName ||
      Functions.getCurrencyDisplayName(PlatformData.currency);
    this.label.string = showCurrency;
  }
}
