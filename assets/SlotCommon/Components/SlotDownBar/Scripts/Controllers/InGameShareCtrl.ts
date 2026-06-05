import {
  _decorator,
  Component,
  assetManager,
  JsonAsset,
  ImageAsset,
  Texture2D,
  Node,
  UITransform,
} from 'cc';
import {SlotGDK} from 'db://assets/SlotModule/Define/SlotGDK';
import {SlotUIBtnEvent} from '../Buttons/SlotUIBtnEvent';
import {PlatformData} from 'db://assets/CommonModule/Script/Define/PlatformData';
import {QRCodeGenerator} from 'db://assets/CommonModule/Script/Utility/QRCodeGenerator';
import RemoteSharedImage from 'db://assets/CommonModule/Script/UIComponent/RemoteSharedImage';
import {DEV, EDITOR} from 'cc/env';
import BQLogger from 'db://assets/CommonModule/Script/Log/BQLog/BQLogger';
const {ccclass, property} = _decorator;

declare global {
  interface Window {
    flutter_inappwebview?: {
      callHandler(handlerName: string, ...args: unknown[]): Promise<unknown>;
    };
  }
}

interface InGameShareConfig {
  imageRootPath: string;
  defaultImagePath: string;
  shareText: string;
  shareReplaceText: string;
  imgPathPostfix: string;
  logoFileName: string;
  useDefault: boolean;
}

@ccclass('InGameShareCtrl')
export class InGameShareCtrl extends Component {
  @property({type: Node, tooltip: '分享背景圖節點（用於座標映射）'})
  private bgNode: Node = null;

  @property({
    type: Node,
    tooltip: 'QRCode 定位節點（位置與尺寸決定 QR Code 繪製區域）',
  })
  private qrcodeNode: Node = null;

  @property({type: RemoteSharedImage, tooltip: 'Logo 圖片'})
  private logo: RemoteSharedImage = null;

  private _config: InGameShareConfig = null;
  private _cachedFile: File = null;
  private _isSharing = false;

  async onLoad() {
    this.setEvents(true);
    if (!EDITOR) {
      await this.loadConfig();
      await this.initLogo();
      await this.preloadImage();
    }
  }

  onDestroy() {
    this.setEvents(false);
  }

  private setEvents(option: boolean) {
    const func = option ? 'insert' : 'remove';
    SlotGDK.event(SlotUIBtnEvent.InGameShareClicked)[func](
      this.onInGameShareClicked,
      this
    );
  }

  private async loadConfig() {
    const postfix = DEV ? '' : `?Date=${Date.now()}`;
    const url = `${PlatformData.gameConfig.RemoteResources}Common/SlotDownBar/InGameShareConfig.json${postfix}`;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = jsonAsset.json as Record<string, any>;
      this._config = {
        ...json,
        shareText: this.resolveMultiLangText(json.shareText),
      } as InGameShareConfig;
    } catch (err) {
      console.warn('[InGameShareCtrl] loadConfig failed:', err);
    }
  }

  private async loadImage(imagePath: string): Promise<File | null> {
    const postfix = this._config?.imgPathPostfix
      ? `?${this._config.imgPathPostfix}`
      : '';
    const fullUrl = `${PlatformData.gameConfig.RemoteResources}${imagePath}${postfix}`;
    try {
      const imageAsset = await new Promise<ImageAsset>((resolve, reject) => {
        assetManager.loadRemote<ImageAsset>(fullUrl, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      return this.imageAssetToFile(imageAsset);
    } catch (err) {
      console.warn('[InGameShareCtrl] loadImage failed:', fullUrl, err);
      return null;
    }
  }

  private imageAssetToFile(imageAsset: ImageAsset): File | null {
    const texture = new Texture2D();
    texture.image = imageAsset;

    const canvas = document.createElement('canvas');
    canvas.width = imageAsset.width;
    canvas.height = imageAsset.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageAsset.data as HTMLImageElement, 0, 0);

    this.compositeLogo(ctx, canvas.width, canvas.height);
    this.compositeQRCode(ctx, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    const byteString = atob(dataUrl.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], {type: 'image/png'});
    return new File([blob], 'share_image.png', {type: 'image/png'});
  }

  private compositeQRCode(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (!this.bgNode || !this.qrcodeNode) return;

    const shareUrl = PlatformData.userSetting.ShareUrl ?? '';
    if (!shareUrl) return;

    const bgTransform = this.bgNode.getComponent(UITransform);
    const qrTransform = this.qrcodeNode.getComponent(UITransform);
    if (!bgTransform || !qrTransform) return;

    try {
      const bgWidth = bgTransform.contentSize.width;
      const bgHeight = bgTransform.contentSize.height;

      // 取得 qrcode 節點在 bg 節點座標空間中的位置
      const worldPos = this.qrcodeNode.worldPosition;
      const localPos = bgTransform.convertToNodeSpaceAR(worldPos);

      const qrWidth = qrTransform.contentSize.width;
      const qrHeight = qrTransform.contentSize.height;
      const qrAnchorX = qrTransform.anchorX;
      const qrAnchorY = qrTransform.anchorY;
      const bgAnchorX = bgTransform.anchorX;
      const bgAnchorY = bgTransform.anchorY;

      // Cocos 座標 → Canvas 像素座標
      const scaleX = canvasWidth / bgWidth;
      const scaleY = canvasHeight / bgHeight;

      const drawX =
        (localPos.x - qrWidth * qrAnchorX + bgWidth * bgAnchorX) * scaleX;
      const drawY =
        (bgHeight * (1 - bgAnchorY) - localPos.y - qrHeight * (1 - qrAnchorY)) *
        scaleY;
      const drawW = qrWidth * scaleX;
      const drawH = qrHeight * scaleY;

      // 生成 QR Code
      const srcCanvas = QRCodeGenerator.generate(shareUrl, {
        errorCorrectionLevel: 'M',
        cellSize: 10,
        margin: 1,
      });

      ctx.drawImage(srcCanvas, drawX, drawY, drawW, drawH);
    } catch (err) {
      console.error('[InGameShareCtrl] Failed to composite QR Code:', err);
    }
  }

  private initLogo(): Promise<void> {
    if (!this.logo) return Promise.resolve();

    const basePath = `Common/SiteResources/${PlatformData.mID}_${PlatformData.siteName}/`;
    const postFix = DEV ? '' : `?${this._config.imgPathPostfix}`;
    this.logo.filePath = `${basePath}${this._config.logoFileName}${postFix}`;
    return new Promise<void>(resolve => {
      this.logo.init(
        () => resolve(),
        (err: unknown) => {
          console.warn('[InGameShareCtrl] logo load failed:', err);
          resolve();
        }
      );
    });
  }

  private compositeLogo(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (!this.bgNode || !this.logo?.sourceCanvas) return;

    const logoNode = this.logo.spriteTarget?.node ?? this.logo.node;
    const bgTransform = this.bgNode.getComponent(UITransform);
    const logoTransform = logoNode.getComponent(UITransform);
    if (!bgTransform || !logoTransform) return;

    try {
      const bgWidth = bgTransform.contentSize.width;
      const bgHeight = bgTransform.contentSize.height;

      // 取得 logo 節點在 bg 節點座標空間中的位置
      const worldPos = logoNode.worldPosition;
      const localPos = bgTransform.convertToNodeSpaceAR(worldPos);

      const logoWidth = logoTransform.contentSize.width;
      const logoHeight = logoTransform.contentSize.height;
      const logoAnchorX = logoTransform.anchorX;
      const logoAnchorY = logoTransform.anchorY;
      const bgAnchorX = bgTransform.anchorX;
      const bgAnchorY = bgTransform.anchorY;

      // Cocos 座標 → Canvas 像素座標
      const scaleX = canvasWidth / bgWidth;
      const scaleY = canvasHeight / bgHeight;

      const drawX =
        (localPos.x - logoWidth * logoAnchorX + bgWidth * bgAnchorX) * scaleX;
      const drawY =
        (bgHeight * (1 - bgAnchorY) -
          localPos.y -
          logoHeight * (1 - logoAnchorY)) *
        scaleY;
      const drawW = logoWidth * scaleX;
      const drawH = logoHeight * scaleY;

      ctx.drawImage(this.logo.sourceCanvas, drawX, drawY, drawW, drawH);
    } catch (err) {
      console.error('[InGameShareCtrl] Failed to composite logo:', err);
    }
  }

  private async preloadImage() {
    if (!this._config) return;
    const gamePath = `${this._config.imageRootPath}${PlatformData.gameName}.jpg`;
    this._cachedFile = this._config.useDefault
      ? null
      : await this.loadImage(gamePath);
    if (!this._cachedFile && this._config.defaultImagePath) {
      console.warn('[InGameShareCtrl] using default image');
      this._cachedFile = await this.loadImage(this._config.defaultImagePath);
    }
  }

  private async onInGameShareClicked() {
    if (this._isSharing) return;
    if (!this._cachedFile) {
      console.warn('[InGameShareCtrl] image not loaded');
      return;
    }

    this._isSharing = true;
    try {
      await this.shareImage(this._cachedFile, this._config.shareText);
      const fromShare = !!PlatformData.userSetting.PromoteId;
      BQLogger.sendClickInGameShareSuccess(fromShare);
    } catch (err) {
      const fromShare = !!PlatformData.userSetting.PromoteId;
      BQLogger.sendClickInGameShareCancel(fromShare);
      console.error('[InGameShareCtrl] share failed:', err);
    } finally {
      this._isSharing = false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resolveMultiLangText(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      const lang = PlatformData.lang || '';
      if (value[lang] !== undefined) {
        return value[lang];
      }
      const prefix = lang.split('-')[0];
      if (prefix && value[prefix] !== undefined) {
        return value[prefix];
      }
      if (value['default'] !== undefined) {
        return value['default'];
      }
      const keys = Object.keys(value);
      if (keys.length > 0) {
        return value[keys[0]];
      }
    }
    return '';
  }

  private async shareImage(file: File, text: string) {
    const shareUrl = PlatformData.userSetting.ShareUrl ?? '';
    const shareText = this._config.shareReplaceText
      ? text.replace(this._config.shareReplaceText, shareUrl)
      : text;

    // 優先使用 Web Share API
    if (navigator.share) {
      const shareData: ShareData = {text: shareText, files: [file]};
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }
    }

    // Fallback: Flutter InAppWebView Bridge
    if (window.flutter_inappwebview?.callHandler) {
      const base64 = await this.fileToBase64(file);
      await window.flutter_inappwebview.callHandler('share', {
        image: base64,
        text: shareText,
      });
      return;
    }

    console.warn('[InGameShareCtrl] No share method available');
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
