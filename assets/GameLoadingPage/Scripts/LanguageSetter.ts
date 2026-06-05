import {_decorator, Component} from 'cc';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import {SlotGDK} from '../../SlotModule/Define/SlotGDK';

const {ccclass} = _decorator;

@ccclass
export default class LanguageSetter extends Component {
  onLoad() {
    SlotGDK.instance.setUsingLanguage(PlatformData.lang);
  }
}
