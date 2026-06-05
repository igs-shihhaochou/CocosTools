import {ClickOKHandle} from './MessagePopup';
import {Define} from '../../CommonModule/Script/Define/GlobalSetting';
import {LangType, MultLang} from '../../SlotModule/UIComponent/MultLang';
import {PlatformData} from '../../CommonModule/Script/Define/PlatformData';
import MultiLangHandler from '../../CommonModule/Script/Core/MultiLangHandler';
import {_decorator, Component, resources, TextAsset} from 'cc';
import {PlatformGDK} from '../../CommonModule/Script/Platform/PlatformGDK';
import BundleManager from '../../CommonModule/Script/Manager/BundleManager';
const {ccclass} = _decorator;

@ccclass
export default class PopupRootController extends Component {
  public get GetUnstableText(): string {
    return MultiLangHandler.getGameText('SYSTEMMESSAGE_UNSTABLE');
  }

  // public async loadPopupRoot() {
  //   if (Define.DEBUG_LOG) console.log('loadPopupRoot');

  //   await new Promise(resolve => {
  //     resources.load(
  //       'Common/Prefab/PopupRoot',
  //       Prefab,
  //       null,
  //       (err: Error, prefab: Prefab) => {
  //         if (err) {
  //           console.error('PopupRoot Not Found');
  //           console.error(err);

  //           alert(this.GetUnstableText);
  //           Functions.closeGame(PlatformData.isMute);
  //           return;
  //         } else {
  //           resolve(prefab);
  //         }
  //       }
  //     );
  //   }).then(result => {
  //     try {
  //       let popupRootNode: Node = null;
  //       popupRootNode = instantiate(result as Prefab);
  //       popupRootNode.parent = director.getScene();
  //       popupRootNode.setPosition(v3(0, 0, 0));
  //       popupRootNode.setSiblingIndex(30);
  //     } catch (err) {
  //       console.error(err);
  //       alert(this.GetUnstableText);
  //       Functions.closeGame(PlatformData.isMute);
  //       return;
  //     }
  //   });
  // }

  public async loadErrorCode() {
    try {
      await this.loadErrorCodeBundle();
    } catch {
      await this.loadErrorCodeResource();
    }
  }

  private async loadBundleAssets(bundleKey: string) {
    return new Promise<void>((resolve, reject) => {
      BundleManager.instance.loadBundleAssets(
        bundleKey,
        null,
        null,
        resolve,
        reject
      );
    });
  }

  private onError(err) {
    //預設語系檔案讀取錯誤處理
    PlatformGDK.instance.showPopUpMessage.notify(
      this.GetUnstableText,
      '255',
      ClickOKHandle.CloseWeb
    );
    console.error(err);
  }

  public async loadErrorCodeResource() {
    if (Define.DEBUG_LOG) console.log('loadErrorCode');
    //Load遊戲設定
    await new Promise(resolve => {
      resources.load(
        '/' +
          PlatformData.gameConfig.ErrorCodeXmlName +
          (MultLang.nowLangType === LangType.en
            ? ''
            : '_' + MultLang.nowLangString),
        TextAsset,
        null,
        (err: Error, res: TextAsset) => {
          if (err) {
            if (MultLang.nowLangType === LangType.en) {
              //預設語系檔案讀取錯誤處理
              PlatformGDK.instance.showPopUpMessage.notify(
                this.GetUnstableText,
                '255',
                ClickOKHandle.CloseWeb
              );
              console.error('ErrorCode Not Found');
              console.error(err);
            } else {
              //其他語系讀取錯誤 讀取預設語系
              resources.load(
                '/' + PlatformData.gameConfig.ErrorCodeXmlName,
                TextAsset,
                null,
                (err: Error, res: TextAsset) => {
                  if (err) {
                    //預設語系檔案讀取錯誤處理
                    PlatformGDK.instance.showPopUpMessage.notify(
                      this.GetUnstableText,
                      '255',
                      ClickOKHandle.CloseWeb
                    );
                    console.error('ErrorCode Not Found');
                    console.error(err);
                    return;
                  } else resolve(res.text);
                }
              );
            }
            return;
          } else resolve(res.text);
        }
      );
    }).then(result => {
      try {
        const parser = new DOMParser();
        const nodeList = parser
          .parseFromString(result as string, 'text/xml')
          .getElementsByTagName('msg');

        for (let i = 0, len = nodeList.length; i < len; i++) {
          PlatformData.instance.errorCodeDic.add(
            parseInt(nodeList[i].getAttribute('code')),
            nodeList[i].textContent
          );
        }

        if (Define.DEBUG_LOG) console.log('loadGameConfig Finish');
      } catch (err) {
        PlatformGDK.instance.showPopUpMessage.notify(
          this.GetUnstableText,
          '255',
          ClickOKHandle.CloseWeb
        );

        console.error(err);
        return;
      }
    });
  }

  public async loadErrorCodeBundle() {
    if (Define.DEBUG_LOG) console.log('loadErrorCodeBundle');
    await this.loadBundleAssets(PlatformData.gameConfig.ErrorCodeXmlName);
    //Load遊戲設定
    const filePath = `${PlatformData.gameConfig.ErrorCodeXmlName}${
      MultLang.nowLangType === LangType.en ? '' : '_' + MultLang.nowLangString
    }`;
    let result: TextAsset = BundleManager.instance.getAsset(
      PlatformData.gameConfig.ErrorCodeXmlName,
      filePath,
      TextAsset
    );

    if (!result) {
      if (MultLang.nowLangType === LangType.en) {
        //預設語系檔案讀取錯誤處理
        this.onError(new Error('ErrorCode Not Found'));
      } else {
        //其他語系讀取錯誤 讀取預設語系
        result = BundleManager.instance.getAsset(
          PlatformData.gameConfig.ErrorCodeXmlName,
          PlatformData.gameConfig.ErrorCodeXmlName,
          TextAsset
        );
        if (!result) {
          this.onError(new Error('ErrorCode Not Found'));
          return;
        }
      }
    }
    const parser = new DOMParser();
    const nodeList = parser
      .parseFromString(result.text as string, 'text/xml')
      .getElementsByTagName('msg');

    await new Promise<void>(resolve => {
      for (let i = 0, len = nodeList.length; i < len; i++) {
        PlatformData.instance.errorCodeDic.add(
          parseInt(nodeList[i].getAttribute('code')),
          nodeList[i].textContent
        );
      }
      resolve();
    });

    if (Define.DEBUG_LOG) console.log('loadGameConfig Finish');
  }
}
