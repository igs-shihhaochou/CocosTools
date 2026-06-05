import {
  _decorator,
  Component,
  CCString,
  CCBoolean,
  Sprite,
  Texture2D,
  UITransform,
  Vec2,
  ImageAsset,
  SpriteFrame,
  assetManager,
} from 'cc';
const {ccclass, property, disallowMultiple, requireComponent} = _decorator;

@ccclass('GifRender')
@disallowMultiple
@requireComponent(Sprite)
export class GifRender extends Component {
  @property(CCString)
  private url = '';
  /** 設定 Url 載完後撥放 */
  public SetUrl(value: string) {
    this.url = value;
    console.log('[GifRender][SetUrl] = ' + this.url);
    this.showGif();
  }
  //    /** 是否 onEnable 的時候要重頭開始撥放 */
  @property(CCBoolean)
  private isOnEnableRestart = true;
  //    /** 是否縮放到 node 設定尺寸 */
  @property(CCBoolean)
  private isFitNodeSize = true;
  private _sprite: Sprite | null = null;
  //    // 画布，可以考虑设置为全局唯一
  private _mainCanvas: HTMLCanvasElement | null = null;
  private _tempCanvas: HTMLCanvasElement | null = null;
  //    // 绘制方法对象
  private _mainContext: CanvasRenderingContext2D | null = null;
  private _tempContext: CanvasRenderingContext2D | null = null;
  private _frames = [];
  private _frameIdx = 0;
  private _frameWidth = 0;
  private _frameHeight = 0;
  private _needsDisposal = false;
  private _frameData: ImageData | null = null;
  private _isInit = false;
  private _spriteScale: Vec2 | null = null;
  onLoad() {
    // 如果在 onLoad 之前就設定 url 就會直接直接繪製，就不需要再走預設的網址
    if (this._isInit) return;
    this.Init();
    // 有設定網址的話預設設載完就撥放
    if (this.url !== '') this.showGif();
  }
  onEnable() {
    if (this.isOnEnableRestart) this.RePlay();
  }
  onDisable() {
    // 清理计时器
    this.unscheduleAllCallbacks();
  }
  private createCanvas() {
    return document.createElement('canvas');
  }
  private Init() {
    if (this._isInit) return;
    this._sprite = this.node.getComponent(Sprite);
    this._mainCanvas = this.createCanvas();
    this._tempCanvas = this.createCanvas();
    this._mainContext = this._mainCanvas.getContext('2d');
    this._tempContext = this._tempCanvas.getContext('2d');
    this._isInit = true;
  }
  private async showGif() {
    if (!this._isInit) this.Init();
    this.unscheduleAllCallbacks();
    // 准备 gif 渲染数据，这里可以设置缓存避免重复解析加载
    const _buffer = await this.getGifData();
    // 解析 gif
    const _parse = () => {}; //parseGIF(_buffer as ArrayBuffer);
    // 解压缩，获取图片列表
    try {
      this._frames = []; //decompressFrames(parse, true);
    } catch (e) {
      console.error(e);
      return;
    }
    // 开始绘制
    this._needsDisposal = true;
    this._frameIdx = 0;
    this._frameWidth = 9999;
    this._frameHeight = 9999;
    this._frameData = null;
    if (this._mainCanvas && this._sprite) {
      this._mainCanvas.width = this._frames[0].dims.width;
      this._mainCanvas.height = this._frames[0].dims.height;
      // 按比例縮放(需要的話)
      const scaleX: number =
        this._sprite.node?.getComponent(UITransform)?.contentSize.width ??
        0 / this._mainCanvas.width;

      const scaleY: number =
        this._sprite.node?.getComponent(UITransform)?.contentSize.height ??
        0 / this._mainCanvas.height;
      this._spriteScale = new Vec2(scaleX, scaleY);
      console.log(
        '[GifRender][showGif] 寬高 = ' + this._mainCanvas.width,
        this._mainCanvas.height
      );
    }

    this.drawGif();
  }
  private drawGif() {
    const frame = this._frames[this._frameIdx];
    const now = Date.now();
    // 清理画布
    if (this._needsDisposal) {
      this._mainContext?.clearRect(0, 0, this._frameWidth, this._frameHeight);
      this._needsDisposal = false;
    }
    // 当前帧大小尺寸是否发生变化，按理不会
    const dims = frame.dims;
    if (
      (!this._frameData ||
        dims.width !== this._frameData.width ||
        dims.height !== this._frameData.height) &&
      this._tempCanvas &&
      this._mainCanvas &&
      this._mainContext &&
      this._frameData
    ) {
      this._tempCanvas.width = dims.width;
      this._tempCanvas.height = dims.height;
      this._frameData = this._mainContext.createImageData(
        dims.width,
        dims.height
      );
    }
    this._frameData?.data.set(frame.patch);
    this._tempContext?.putImageData(this._frameData, 0, 0);
    this._mainContext.drawImage(this._tempCanvas, dims.left, dims.top);
    this._frameIdx++;
    if (this._frameIdx >= this._frames.length) {
      this._frameIdx = 0;
    }
    if (frame.disposalType === 2) {
      this._needsDisposal = true;
    }
    const texture: Texture2D = new Texture2D();
    texture.image = ImageAsset.deserialize(this._mainCanvas.toDataURL());
    texture.updateImage();
    const spriteFrame = new SpriteFrame();
    spriteFrame.texture = texture;
    this._sprite.spriteFrame = new SpriteFrame();
    if (this.isFitNodeSize) {
      const {x, y} = this._spriteScale;
      this._sprite.node.setScale(x, y);
    }
    // 循环绘制
    const diff = Date.now() - now;
    const time = Math.max(0, Math.floor(frame.delay - diff)) / 1000;
    this.scheduleOnce(this.drawGif.bind(this), time);
  }
  private getGifData() {
    return new Promise((res, rej) => {
      assetManager.loadRemote(this.url, (error, asset) => {
        // cc.resources.load(this.url, (error, asset) => {
        if (error) {
          console.error(error);
          rej(error);
        }
        this.loadImgArrayBuffer(asset.nativeUrl).then(res);
      });
    });
  }
  private loadImgArrayBuffer(url: string): Promise<ArrayBuffer | null> {
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          resolve(xhr.response);
        }
      };
      xhr.onerror = function (err) {
        console.error('xhr error', err);
        resolve(null);
      };
      xhr.send(null);
      setTimeout(() => {
        resolve(null);
      }, 10 * 10000);
    });
  }
  //=== [控制] ====
  /**從頭開始撥放*/
  public RePlay() {
    if (this.url === '' || this._frames.length === 0) {
      console.error('[GifRender][Replay] 失敗，下載中 or URL = ' + this.url);
      return;
    }
    this.Stop();
    this.drawGif();
  }
  public Pause() {
    this.unscheduleAllCallbacks();
  }
  public Resume() {
    if (this.url === '' || this._frames.length === 0) {
      console.error('[GifRender][Resume] 失敗，下載中 or URL = ' + this.url);
      return;
    }
    this.drawGif();
  }
  public Stop() {
    this.unscheduleAllCallbacks();
    this._frameIdx = 0;
  }
}
