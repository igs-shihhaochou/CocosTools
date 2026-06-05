import {_decorator, Component, Label, Node, Sprite} from 'cc';
const {ccclass, property} = _decorator;

import MultiLangHandler from '../../../CommonModule/Script/Core/MultiLangHandler';
import {PlatformData} from '../../../CommonModule/Script/Define/PlatformData';
import {SpawnPool} from '../../../CommonModule/Script/UIComponent/SpawnPool';
import Functions from '../../../CommonModule/Script/Utility/Functions';
import {SlotGDK} from '../../../SlotModule/Define/SlotGDK';
import {MultLang} from '../../../SlotModule/UIComponent/MultLang';
import {setSize} from '../../../CommonModule/Script/Utility/NodeProperty';
export enum MessageType {
  Empty,
  Gabage,
  LineResult,
  WaysResult,
  CountResult,
  ThisWin,
  Retrigger,
}

@ccclass('SystemMessageUI')
export class SystemMessageUI extends Component {
  private multiLangSPAMTextKey: Array<string> = [
    'SYSTEMMESSAGE_SPAM_00',
    'SYSTEMMESSAGE_SPAM_01',
    'SYSTEMMESSAGE_SPAM_02',
    'SYSTEMMESSAGE_SPAM_03',
    'SYSTEMMESSAGE_SPAM_04',
    'SYSTEMMESSAGE_SPAM_05',
    'SYSTEMMESSAGE_SPAM_06',
    'SYSTEMMESSAGE_SPAM_07',
    'SYSTEMMESSAGE_SPAM_08',
    'SYSTEMMESSAGE_SPAM_09',
    'SYSTEMMESSAGE_SPAM_10',
    'SYSTEMMESSAGE_SPAM_11',
    'SYSTEMMESSAGE_SPAM_12',
    'SYSTEMMESSAGE_SPAM_13',
    'SYSTEMMESSAGE_SPAM_14',
    'SYSTEMMESSAGE_SPAM_15',
    'SYSTEMMESSAGE_SPAM_16',
    'SYSTEMMESSAGE_SPAM_17',
    'SYSTEMMESSAGE_SPAM_18',
    'SYSTEMMESSAGE_SPAM_19',
  ];
  private multiLangLineKey = 'SYSTEMMESSAGE_LINE';
  private multiLangWinKey = 'SYSTEMMESSAGE_WIN';
  private multiLangRetriggerKey = 'SYSTEMMESSAGE_RETRIGGER';
  private multiLangSPAMTextAry: string[] = [];
  private get GetGarbageTextAry(): string[] {
    return this.multiLangSPAMTextAry;
  }
  private get GetLineText(): string {
    return MultiLangHandler.getGameText(this.multiLangLineKey);
  }
  private get GetWinText(): string {
    return MultiLangHandler.getGameText(this.multiLangWinKey);
  }
  private get GetRetriggerText(): string {
    return MultiLangHandler.getGameText(this.multiLangRetriggerKey);
  }
  @property(Node)
  public systemMessageBg: Node | null = null; ////系統訊息的背景
  @property(SpawnPool)
  public SpawnPoolL: SpawnPool = null; ////左側的系統訊息SpawnPool
  @property(SpawnPool)
  public SpawnPoolM: SpawnPool = null; ////中間的系統訊息SpawnPool
  @property(SpawnPool)
  public SpawnPoolR: SpawnPool = null; ////右側的系統訊息SpawnPool
  public systemMessageLabelNode: Node | null = null; ////系統訊息的內文Label的預置物
  public systemMessageSpriteNode: Node | null = null; ////系統訊息的內文Sprite的預置物
  private currentGabageText = ''; ////目前的垃圾話訊息
  public onLoad() {
    this.AddSPAMText();
    this.systemMessageLabelNode = new Node('systemMessageLabelNode');
    const TempLabel: Label = this.systemMessageLabelNode.addComponent(Label);
    TempLabel.fontSize = 25;
    TempLabel.lineHeight = 35;
    TempLabel.verticalAlign = Label.VerticalAlign.CENTER;
    TempLabel.fontFamily = 'Microsoft JhengHei';
    this.systemMessageSpriteNode = new Node('systemMessageSpriteNode');
    const TempSprite: Sprite =
      this.systemMessageSpriteNode.addComponent(Sprite);
    TempSprite.sizeMode = Sprite.SizeMode.CUSTOM;
    setSize(this.systemMessageSpriteNode, 30, 30);
  }
  ////顯示系統訊息的背景
  public ShowBg(isShow: boolean) {
    this.systemMessageBg.active = isShow;
  }
  ////顯示系統訊息
  public ShowMessage(messageType: MessageType, messageData?) {
    this.ShowBg(messageType !== MessageType.Empty);
    if (messageType === MessageType.Empty) {
      ////清空所有訊息
      this.SpawnPoolL.despawnAll();
      this.SpawnPoolM.despawnAll();
      this.SpawnPoolR.despawnAll();
      this.currentGabageText = '';
    } else if (messageType === MessageType.Gabage) {
      ////產生垃圾話(左側)
      // this.SpawnPool_R.DespawnAll();
      this.SpawnPoolL.despawnAll();
      if (this.currentGabageText === '')
        this.currentGabageText = this.SetGarbageText(messageData.thisWin);
      const systemMessageLabel: Label = this.SpawnPoolL.spawn(
        this.systemMessageLabelNode,
        this.SpawnPoolL.node
      ).getComponent<Label>(Label);
      // systemMessageLabel.string = this.SetGarbageText(messageData.thisWin);
      systemMessageLabel.string = this.currentGabageText;
    } else if (messageType === MessageType.LineResult) {
      ////產生線獎資訊(右側)
      // {lineId : lineId, symbolId : symbolId, symbolCount : symbolCount, win : win}
      this.SpawnPoolR.despawnAll();
      ////串前面線的文字
      const messageLabel1: Label = this.SpawnPoolR.spawn(
        this.systemMessageLabelNode,
        this.SpawnPoolR.node
      ).getComponent<Label>(Label);
      messageLabel1.string = this.GetLineText.replace(
        /%s/,
        messageData.lineId + 1
      ); ////lineId從0開始，顯示給玩家要從1開始
      messageLabel1.node.setSiblingIndex(0);
      ////串中間Symbol圖片
      for (let i = 0; i < messageData.symbolCount; i++) {
        const messageSprite: Sprite = this.SpawnPoolR.spawn(
          this.systemMessageSpriteNode,
          this.SpawnPoolR.node
        ).getComponent<Sprite>(Sprite);
        messageSprite.spriteFrame = SlotGDK.instance.getSlotSpriteFrame(
          messageData.symbolId
        );
        messageSprite.node.setSiblingIndex(1);
      }
      ////串multiplier
      if (messageData.multiplier > 1) {
        const messageLabel2: Label = this.SpawnPoolR.spawn(
          this.systemMessageLabelNode,
          this.SpawnPoolR.node
        ).getComponent<Label>(Label);
        messageLabel2.string = ' X ' + messageData.multiplier;
        messageLabel2.node.setSiblingIndex(2);
      }
      ////串後面win分文字
      const messageLabel3: Label = this.SpawnPoolR.spawn(
        this.systemMessageLabelNode,
        this.SpawnPoolR.node
      ).getComponent<Label>(Label);
      messageLabel3.string =
        ' = ' +
        Functions.numberFormat(
          messageData.win,
          Functions.getAdaptiveDecimalPlaces(
            messageData.win,
            PlatformData.currencyRatio,
            PlatformData.decimalPlaces
          ),
          true,
          '',
          PlatformData.currencyRatio
        );
      messageLabel3.node.setSiblingIndex(3);
    } else if (messageType === MessageType.WaysResult) {
      ////產生Ways組合資訊(右側)
      // {waysCount : waysCount, symbolId : symbolId, symbolCount : symbolCount, win : win}
      this.SpawnPoolR.despawnAll();
      ////串中間Symbol圖片
      for (let i = 0; i < messageData.symbolCount; i++) {
        const messageSprite: Sprite = this.SpawnPoolR.spawn(
          this.systemMessageSpriteNode,
          this.SpawnPoolR.node
        ).getComponent<Sprite>(Sprite);
        messageSprite.spriteFrame = SlotGDK.instance.getSlotSpriteFrame(
          messageData.symbolId
        );
        messageSprite.node.setSiblingIndex(0);
      }
      ////串multiplier
      if (messageData.multiplier > 1) {
        const messageLabel1: Label = this.SpawnPoolR.spawn(
          this.systemMessageLabelNode,
          this.SpawnPoolR.node
        ).getComponent<Label>(Label);
        messageLabel1.string = ' X ' + messageData.multiplier;
        messageLabel1.node.setSiblingIndex(1);
      }
      ////串後面倍數和win分文字
      const messageLabel2: Label = this.SpawnPoolR.spawn(
        this.systemMessageLabelNode,
        this.SpawnPoolR.node
      ).getComponent<Label>(Label);
      messageLabel2.string =
        ' X ' +
        messageData.waysCount +
        ' = ' +
        Functions.numberFormat(
          messageData.win,
          Functions.getAdaptiveDecimalPlaces(
            messageData.win,
            PlatformData.currencyRatio,
            PlatformData.decimalPlaces
          ),
          false,
          '',
          PlatformData.currencyRatio
        );
      messageLabel2.node.setSiblingIndex(2);
    } else if (messageType === MessageType.CountResult) {
      ////產生Count組合資訊(右側)
      // {totalCount : totalCount, symbolId : symbolId, win : win};
      this.SpawnPoolR.despawnAll();
      ////串中間Symbol圖片
      for (let i = 0; i < messageData.totalCount; i++) {
        const messageSprite: Sprite = this.SpawnPoolR.spawn(
          this.systemMessageSpriteNode,
          this.SpawnPoolR.node
        ).getComponent<Sprite>(Sprite);
        messageSprite.spriteFrame = SlotGDK.instance.getSlotSpriteFrame(
          messageData.symbolId
        );
        messageSprite.node.setSiblingIndex(0);
      }
      ////串multiplier
      if (messageData.multiplier > 1) {
        const messageLabelMultiplier: Label = this.SpawnPoolR.spawn(
          this.systemMessageLabelNode,
          this.SpawnPoolR.node
        ).getComponent<Label>(Label);
        messageLabelMultiplier.string = ' X ' + messageData.multiplier;
        messageLabelMultiplier.node.setSiblingIndex(1);
      }
      ////串後面倍數和win分文字
      const messageLabel2: Label = this.SpawnPoolR.spawn(
        this.systemMessageLabelNode,
        this.SpawnPoolR.node
      ).getComponent<Label>(Label);
      messageLabel2.string =
        ' = ' +
        Functions.numberFormat(
          messageData.win,
          Functions.getAdaptiveDecimalPlaces(
            messageData.win,
            PlatformData.currencyRatio,
            PlatformData.decimalPlaces
          ),
          false,
          '',
          PlatformData.currencyRatio
        );
      messageLabel2.node.setSiblingIndex(1);
    } else if (messageType === MessageType.ThisWin) {
      ////Show這一手的Win(右側)
      this.SpawnPoolR.despawnAll();
      const systemMessageLabel: Label = this.SpawnPoolR.spawn(
        this.systemMessageLabelNode,
        this.SpawnPoolR.node
      ).getComponent<Label>(Label);
      systemMessageLabel.string =
        this.GetWinText +
        Functions.numberFormat(
          messageData.thisWin,
          Functions.getAdaptiveDecimalPlaces(
            messageData.thisWin,
            PlatformData.currencyRatio,
            PlatformData.decimalPlaces
          ),
          false,
          '',
          PlatformData.currencyRatio
        );
    } else if (messageType === MessageType.Retrigger) {
      ////Rtrigger的訊息(中間)
      this.SpawnPoolL.despawnAll();
      this.SpawnPoolM.despawnAll();
      this.SpawnPoolR.despawnAll();
      const systemMessageLabel: Label = this.SpawnPoolM.spawn(
        this.systemMessageLabelNode,
        this.SpawnPoolM.node
      ).getComponent(Label);
      systemMessageLabel.string = this.GetRetriggerText;
    }
  }
  ////取得要顯示的垃圾話
  public SetGarbageText(totalWin: number): string {
    let currentLanguageGarbageTextAry: string[] = []; ///目前語言的垃圾話陣列
    ////判斷語言決定使用的陣列
    currentLanguageGarbageTextAry = this.GetGarbageTextAry;
    let randomIndex = 0;
    if (totalWin > PlatformData.instance.currentTotalBet * 50) {
      randomIndex = 19;
    } else if (totalWin > PlatformData.instance.currentTotalBet * 25) {
      randomIndex = 18;
    } else if (totalWin > PlatformData.instance.currentTotalBet * 10) {
      randomIndex = 17;
    } else if (totalWin > PlatformData.instance.currentTotalBet * 5) {
      randomIndex = Math.floor(Math.random() * 8 + 9);
    } else if (totalWin > PlatformData.instance.currentTotalBet) {
      randomIndex = Math.floor(Math.random() * 8 + 1);
    } else {
      randomIndex = 0;
    }
    return currentLanguageGarbageTextAry[randomIndex];
  }
  ////取得對應語系內容 若無則預設取得en
  private GetTextObjectLang(object: Object) {
    let lang: string = MultLang.nowLangString;
    if (object[lang] === null) lang = 'en';
    return object[lang];
  }
  private AddSPAMText() {
    this.multiLangSPAMTextKey.forEach(ele => {
      this.multiLangSPAMTextAry.push(MultiLangHandler.getGameText(ele));
    });
    console.log('AddMultiLangText:', this.multiLangSPAMTextAry);
  }
}
