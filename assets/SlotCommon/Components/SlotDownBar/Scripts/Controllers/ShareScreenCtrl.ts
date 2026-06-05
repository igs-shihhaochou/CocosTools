import {
  _decorator,
  assetManager,
  Component,
  JsonAsset,
  Node,
  Texture2D,
  find,
  Sprite,
  SpriteFrame,
  Toggle,
  UITransform,
  Vec3,
} from 'cc';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import {PlatformGDK} from 'db://assets/CommonModule/Script/Platform/PlatformGDK';
import {setOpacity} from 'db://assets/CommonModule/Script/Utility/NodeProperty';
import {waitForSeconds} from 'db://assets/CommonModule/Script/ExtraType';
import EventManager from 'db://assets/CommonModule/Script/Manager/EventManager';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import {ScreenCaptureUtil} from 'db://assets/CommonModule/Script/UIComponent/ScreenCaptureUtil';
import {QRCodeGenerator} from 'db://assets/CommonModule/Script/Utility/QRCodeGenerator';
import {EDITOR} from 'cc/env';
import {ShareConfig} from '../Define/ShareConfig';
import {RoundMaskCtrl} from './RoundMaskCtrl';
import OrientationManager from 'db://assets/CommonModule/Script/Manager/OrientationManager';
import RemoteSharedImage from 'db://assets/CommonModule/Script/UIComponent/RemoteSharedImage';
const {ccclass, property} = _decorator;

@ccclass('ShareScreenCtrl')
export class ShareScreenCtrl extends Component {
  @property(Sprite)
  private displaySprite: Sprite = null;

  @property({type: Sprite, tooltip: '分享背景圖 Sprite'})
  private backgroundSprite: Sprite = null;

  @property({
    type: Node,
    tooltip: '截圖放置區域（在背景圖上的位置與尺寸）',
  })
  private screenshotArea: Node = null;

  @property({
    type: [Node],
    tooltip: '合成到最終圖片上的覆蓋層（Sprite 或 Label）',
  })
  private overlays: Node[] = [];

  @property(Node)
  private contentNode: Node = null;

  @property(Node)
  private rootNode: Node = null;

  @property(Node)
  private slotUI: Node = null;

  @property(RoundMaskCtrl)
  private roundMaskCtrl: RoundMaskCtrl = null;

  @property({type: Toggle, tooltip: '今日不再顯示 Checkbox'})
  private dontShowTodayToggle: Toggle = null;

  @property({
    type: Node,
    tooltip: 'QRCode 節點 (Sprite 將由動態生成的 QR Code 填入）',
  })
  private qrcodeNode: Node = null;

  @property({type: RemoteSharedImage, tooltip: 'Logo 圖片'})
  private logo: RemoteSharedImage = null;

  @property({type: RemoteSharedImage, tooltip: '橫版 Logo 圖片'})
  private logoLandscape: RemoteSharedImage = null;

  @property({type: RemoteSharedImage, tooltip: '直版 Logo 圖片'})
  private logoPortrait: RemoteSharedImage = null;

  private get storageKey(): string {
    return `ShareScreen_DontShowDate_${PlatformData.nickName}_${PlatformData.gameName}`;
  }

  private isSharing = false;
  private _cachedScreenshotFile: File | null = null;
  private _cachedRenderTexture: Texture2D | null = null;

  private commonRootNode: Node = null;

  private shareCallback: Function = null;
  private _hasShared = false;
  private _cachedImageWidth = 0;
  private _cachedImageHeight = 0;

  private _autoCloseTimer: ReturnType<typeof setTimeout> = null;
  private _savedOrientationSupport = true;

  async onLoad() {
    this.commonRootNode = find('CommonRoot');
    if (!EDITOR) {
      await this.loadShareConfig();
      this.initRemoteImages();
    }
    this.setEvents(true);
  }

  onDestroy() {
    this.setEvents(false);
    this.stopAutoCloseTimer();
    if (this._cachedRenderTexture) {
      this._cachedRenderTexture.destroy();
      this._cachedRenderTexture = null;
    }
    this._cachedScreenshotFile = null;
  }

  private async loadShareConfig() {
    const url = `${PlatformData.gameConfig.RemoteResources}Common/SlotDownBar/ShareScreenConfig.json?Date=${Date.now()}`;
    try {
      const jsonAsset = await new Promise<JsonAsset>((resolve, reject) => {
        assetManager.loadRemote<JsonAsset>(url, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      this.applyShareConfig(jsonAsset.json);
    } catch (err) {
      console.warn(
        '[ShareScreenCtrl] loadShareConfig failed, using defaults:',
        err
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyShareConfig(json: Record<string, any>) {
    if (json.shareScreenTimeOut !== undefined) {
      ShareConfig.shareScreenTimeOut = json.shareScreenTimeOut;
    }
    if (json.shareScreenShareText !== undefined) {
      ShareConfig.shareScreenShareText = this.resolveMultiLangText(
        json.shareScreenShareText
      );
    }
    if (json.shareReplaceText !== undefined) {
      ShareConfig.shareReplaceText = json.shareReplaceText;
    }
    if (json.urlPostfix !== undefined) {
      ShareConfig.urlPostfix = json.urlPostfix;
    }
    if (json.logoFileName !== undefined) {
      ShareConfig.logoFileName = json.logoFileName;
    }
    if (json.logoFileNameLandscape !== undefined) {
      ShareConfig.logoFileNameLandscape = json.logoFileNameLandscape;
    }
    if (json.logoFileNamePortrait !== undefined) {
      ShareConfig.logoFileNamePortrait = json.logoFileNamePortrait;
    }
  }

  /**
   * 解析多語系文字，支援字串或語系物件
   * 若為字串則直接回傳；若為物件則依 PlatformData.lang 取得對應語系文字
   * 優先順序：完整語系碼 > 語系前綴 > default > 第一個值
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resolveMultiLangText(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      const lang = PlatformData.lang || '';
      // 完整語系碼 (e.g. "en-us")
      if (value[lang] !== undefined) {
        return value[lang];
      }
      // 語系前綴 (e.g. "en")
      const prefix = lang.split('-')[0];
      if (prefix && value[prefix] !== undefined) {
        return value[prefix];
      }
      // 預設值
      if (value['default'] !== undefined) {
        return value['default'];
      }
      // 取第一個值作為 fallback
      const keys = Object.keys(value);
      if (keys.length > 0) {
        return value[keys[0]];
      }
    }
    return '';
  }

  private initRemoteImages() {
    const basePath = `Common/SiteResources/${PlatformData.mID}_${PlatformData.siteName}/`;
    const hasOrientationLogos =
      this.logoLandscape &&
      this.logoPortrait &&
      ShareConfig.logoFileNameLandscape &&
      ShareConfig.logoFileNamePortrait;

    if (hasOrientationLogos) {
      this.initOrientationLogo(
        this.logoLandscape,
        basePath,
        ShareConfig.logoFileNameLandscape
      );
      this.initOrientationLogo(
        this.logoPortrait,
        basePath,
        ShareConfig.logoFileNamePortrait
      );
      this.updateLogoVisibility();
    } else if (this.logo) {
      this.logo.filePath = `${basePath}${ShareConfig.logoFileName}?${ShareConfig.urlPostfix}`;
      this.logo.init(() => {
        const node = this.logo.spriteTarget?.node ?? this.logo.node;
        if (this.logo.sourceCanvas) {
          ScreenCaptureUtil.setNodeImageSource(node, this.logo.sourceCanvas);
        }
      });
    }
  }

  private initOrientationLogo(
    logo: RemoteSharedImage,
    basePath: string,
    fileName: string
  ) {
    logo.filePath = `${basePath}${fileName}?${ShareConfig.urlPostfix}`;
    logo.init(() => {
      const node = logo.spriteTarget?.node ?? logo.node;
      if (logo.sourceCanvas) {
        ScreenCaptureUtil.setNodeImageSource(node, logo.sourceCanvas);
      }
    });
  }

  private updateLogoVisibility() {
    if (!this.logoLandscape || !this.logoPortrait) return;
    const isLandscape = PlatformData.isLandscape;
    this.logoLandscape.node.active = isLandscape;
    this.logoPortrait.node.active = !isLandscape;
  }

  private generateQRCode() {
    const shareUrl = PlatformData.userSetting.ShareUrl ?? 'www.google.com';
    if (!shareUrl || !this.qrcodeNode) {
      console.error(
        '[ShareScreenCtrl] Failed to generate QR Code: no share url or qrcode node'
      );
    }

    const sprite = this.qrcodeNode.getComponent(Sprite);
    if (!sprite) return;

    try {
      const uiTransform = this.qrcodeNode.getComponent(UITransform);
      const qrSize = uiTransform
        ? Math.round(
            Math.max(
              uiTransform.contentSize.width,
              uiTransform.contentSize.height
            )
          )
        : 75;
      const srcCanvas = QRCodeGenerator.generate(shareUrl, {
        errorCorrectionLevel: 'M',
        cellSize: 10,
        margin: 1,
      });

      const canvas = document.createElement('canvas');
      canvas.width = qrSize;
      canvas.height = qrSize;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(srcCanvas, 0, 0, qrSize, qrSize);

      const texture = new Texture2D();
      texture.reset({
        width: qrSize,
        height: qrSize,
        format: Texture2D.PixelFormat.RGBA8888,
      });
      const imageData = ctx.getImageData(0, 0, qrSize, qrSize);
      texture.uploadData(new Uint8Array(imageData.data.buffer));

      const spriteFrame = new SpriteFrame();
      spriteFrame.texture = texture;
      sprite.spriteFrame = spriteFrame;

      // 註冊 canvas 來源供截圖 overlay 繪製使用
      ScreenCaptureUtil.setNodeImageSource(this.qrcodeNode, canvas);
    } catch (err) {
      console.error('[ShareScreenCtrl] Failed to generate QR Code:', err);
    }
  }

  private setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    SlotGDK.event(SlotUIBtnEvent.ShareClicked)[func](this.onShareClicked, this);
    PlatformGDK.instance.showSharePopup[func](this.onShowSharePopup, this);
    SlotGDK.event(SlotUIBtnEvent.CloseShareClicked)[func](
      this.onCloseShareClicked,
      this
    );
    const eventFunc = option ? 'addEventListener' : 'removeEventListener';
    EventManager.instance[eventFunc](
      PlatformData.gameEventName.AFTER_ORIENTATION_CHANGE,
      this.onOrientationChange,
      this
    );
  }

  private async onShowSharePopup(callback: Function) {
    if (this.isDontShowToday()) {
      callback?.(false);
      return;
    }

    this.lockOrientation();
    PlatformGDK.instance.openLoadingPage.notify(this);
    await waitForSeconds(0.2);
    PlatformGDK.instance.closeLoadingPage.notify(this);
    this._hasShared = false;
    this.shareCallback = callback;
    this.resetDontShowTodayToggle();
    this.setUIVisible(false);
    await waitForSeconds(0.1);
    this.generateQRCode();
    await this.captureAndPreview();
    this.setUIVisible(true);
    this.rootNode.active = true;
    this.startAutoCloseTimer();
    this.startRoundMaskCountdown();
  }

  private onCloseShareClicked() {
    this.stopAutoCloseTimer();
    this.stopRoundMaskCountdown();
    this.unlockOrientation();
    this.saveDontShowTodayIfChecked();
    this.rootNode.active = false;
    this.shareCallback?.(this._hasShared);
  }

  private onOrientationChange() {
    this.updateLogoVisibility();
    if (
      !this.displaySprite?.isValid ||
      !this._cachedImageWidth ||
      !this._cachedImageHeight
    ) {
      return;
    }
    this.fitDisplaySpriteToContentNode(
      this._cachedImageWidth,
      this._cachedImageHeight
    );
  }

  private fitDisplaySpriteToContentNode(
    imageWidth: number,
    imageHeight: number
  ) {
    if (
      !this.contentNode?.isValid ||
      !this.displaySprite?.isValid ||
      imageWidth <= 0 ||
      imageHeight <= 0
    ) {
      return;
    }
    const contentTransform = this.contentNode.getComponent(UITransform);
    if (!contentTransform) return;
    const displayTransform = this.displaySprite.getComponent(UITransform);
    if (!displayTransform) return;

    const contentW = contentTransform.contentSize.width;
    const contentH = contentTransform.contentSize.height;
    if (contentW <= 0 || contentH <= 0) return;

    const scaleX = contentW / imageWidth;
    const scaleY = contentH / imageHeight;
    const fitScale = Math.min(scaleX, scaleY);

    displayTransform.setContentSize(
      imageWidth * fitScale,
      imageHeight * fitScale
    );
    this.displaySprite.node.setScale(Vec3.ONE);
  }

  private async onShareClicked() {
    if (this.isSharing) {
      console.warn('[ShareScreenCtrl] Share already in progress');
      return;
    }

    this.isSharing = true;
    this.stopAutoCloseTimer();
    this.stopRoundMaskCountdown();
    try {
      let file = this._cachedScreenshotFile;
      if (!file) {
        file = await this.captureToFile();
      }
      if (!file) {
        console.error('[ShareScreenCtrl] Failed to capture screen');
        this.startAutoCloseTimer();
        return;
      }
      await this.shareImage(file);
      this._hasShared = true;
      this.onCloseShareClicked();
    } catch (error) {
      console.error('[ShareScreenCtrl] Share failed:', error);
      this.startAutoCloseTimer();
      this.startRoundMaskCountdown();
    } finally {
      this.isSharing = false;
    }
  }

  private startAutoCloseTimer() {
    this.stopAutoCloseTimer();
    const timeout = ShareConfig.shareScreenTimeOut;
    if (timeout <= 0) return;
    this._autoCloseTimer = setTimeout(() => {
      this._autoCloseTimer = null;
      this.onCloseShareClicked();
    }, timeout * 1000);
  }

  private stopAutoCloseTimer() {
    if (this._autoCloseTimer) {
      clearTimeout(this._autoCloseTimer);
      this._autoCloseTimer = null;
    }
  }

  private startRoundMaskCountdown() {
    if (!this.roundMaskCtrl) return;
    const timeout = ShareConfig.shareScreenTimeOut;
    if (timeout <= 0) return;
    this.roundMaskCtrl.startCountdown(timeout, false, true);
  }

  private stopRoundMaskCountdown() {
    if (!this.roundMaskCtrl) return;
    this.roundMaskCtrl.stopCountdown();
  }

  private lockOrientation() {
    const mgr = OrientationManager.instance;
    if (!mgr) return;
    this._savedOrientationSupport = mgr.isSupportOrientationChange;
    mgr.isSupportOrientationChange = false;
  }

  private unlockOrientation() {
    const mgr = OrientationManager.instance;
    if (!mgr) return;
    mgr.isSupportOrientationChange = this._savedOrientationSupport;
  }

  private setUIVisible(visible: boolean) {
    const opacity = visible ? 255 : 0;
    setOpacity(this.commonRootNode, opacity);
    setOpacity(this.slotUI.parent, opacity);
  }

  private async captureAndPreview() {
    if (this._cachedRenderTexture) {
      this._cachedRenderTexture.destroy();
      this._cachedRenderTexture = null;
    }
    this._cachedScreenshotFile = null;
    this.backgroundSprite.node.active = true;

    const result = await ScreenCaptureUtil.capture({
      offsetHeight: 0,
      maxLongSide: 1280,
      backgroundSprite: this.backgroundSprite,
      screenshotArea: this.screenshotArea,
      overlays: this.overlays,
      backgroundOverlays: [],
      imageFileName: this.getImageFileName(),
    });
    this.backgroundSprite.node.active = false;

    if (!result) {
      console.error('[ShareScreenCtrl] Failed to capture');
      return;
    }

    const {compositeCanvas, width: cW, height: cH} = result;
    this._cachedImageWidth = cW;
    this._cachedImageHeight = cH;

    // 設定 displaySprite preview
    if (this.displaySprite && this.displaySprite.isValid) {
      const rt = ScreenCaptureUtil.canvasToRenderTexture(compositeCanvas);
      if (rt) {
        this._cachedRenderTexture = rt;
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = rt;
        this.displaySprite.spriteFrame = spriteFrame;
        this.fitDisplaySpriteToContentNode(cW, cH);
      }
    }

    // 快取分享檔案
    const file = await ScreenCaptureUtil.canvasToFile(
      compositeCanvas,
      this.getImageFileName()
    );
    if (file) {
      this._cachedScreenshotFile = file;
    }
  }

  private async captureToFile(): Promise<File | null> {
    const result = await ScreenCaptureUtil.capture({
      offsetHeight: 0,
      maxLongSide: 1280,
      backgroundSprite: this.backgroundSprite,
      screenshotArea: this.screenshotArea,
      overlays: this.overlays,
      backgroundOverlays: [],
      imageFileName: this.getImageFileName(),
    });

    if (!result) return null;

    return ScreenCaptureUtil.canvasToFile(
      result.compositeCanvas,
      this.getImageFileName()
    );
  }

  private async shareImage(file: File): Promise<void> {
    if (!navigator.share) {
      console.warn('[ShareScreenCtrl] Web Share API not supported');
      return;
    }

    const shareUrl = PlatformData.userSetting.ShareUrl ?? '';
    const shareText = ShareConfig.shareReplaceText
      ? ShareConfig.shareScreenShareText.replace(
          ShareConfig.shareReplaceText,
          shareUrl
        )
      : ShareConfig.shareScreenShareText;

    const shareData: ShareData = {
      text: shareText,
      files: [file],
    };

    if (!navigator.canShare || !navigator.canShare(shareData)) {
      console.warn('[ShareScreenCtrl] Cannot share this content');
      return;
    }

    await navigator.share(shareData);
    console.log('[ShareScreenCtrl] Share successful');
  }

  private getImageFileName(): string {
    const now = new Date();
    const y = now.getFullYear();
    const M = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `screenshot_${y}${M}${d}_${h}${m}${s}.png`;
  }

  private getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  private isDontShowToday(): boolean {
    const saved = localStorage.getItem(this.storageKey);
    return saved === this.getTodayString();
  }

  private saveDontShowTodayIfChecked() {
    if (this.dontShowTodayToggle?.isChecked) {
      localStorage.setItem(this.storageKey, this.getTodayString());
    }
  }

  private resetDontShowTodayToggle() {
    if (this.dontShowTodayToggle) {
      this.dontShowTodayToggle.isChecked = false;
    }
  }

  public setShareText(text: string) {
    ShareConfig.shareScreenShareText = text;
  }

  public async share(text?: string): Promise<void> {
    if (text !== undefined) {
      ShareConfig.shareScreenShareText = text;
    }
    await this.onShareClicked();
  }
}
