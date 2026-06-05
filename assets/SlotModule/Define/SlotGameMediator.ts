import {SymbolSetting} from '../Wheel/SymbolSetting';
import {SpecialGameAgent} from '../SpecialGame/SpecialGameAgent';
import {AwardController} from '../Award/AwardController';
import {WheelsBlockManager} from '../Wheel/WheelsBlockManager';
import {MainGameHost} from '../Host/MainGameHost';
import SoundManager from '../../CommonModule/Script/Manager/SoundManager';

//仲介者模式
export class SlotGameMediator {
  public static get instance(): SlotGameMediator {
    if (!window['slotGameMediator']) {
      window['slotGameMediator'] = new SlotGameMediator();
    }
    return window['slotGameMediator'];
  }

  public mainGameHost: MainGameHost = null;

  public symbolSetting: SymbolSetting = null;

  public specialGameAgent: SpecialGameAgent = null;

  public awardController: AwardController = null;

  public wheelsManager: WheelsBlockManager = null;

  public audioManager: SoundManager = SoundManager.instance;
}
