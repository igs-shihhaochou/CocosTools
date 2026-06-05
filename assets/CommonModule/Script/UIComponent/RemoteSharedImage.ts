import {
  _decorator,
  Component,
  Sprite,
  Enum,
  SpriteFrame,
  Texture2D,
  Node,
  assetManager,
  Scene,
  ImageAsset,
  type Size,
} from 'cc';
const {ccclass, property, menu} = _decorator;

import {PlatformData} from '../Define/PlatformData';
import {getSize, setSize, getUItrans} from '../Utility/NodeProperty';
enum enumFillType {
  FIT_NODE, //將圖片按照節點尺寸擺放
  RAW, //根據載入圖片擺放
}
/**
 * 遠端共用圖檔資源
 * 至遠端資源下載圖片
 * 相同路徑共用Texture
 */

@ccclass('RemoteSharedImage')
@menu('CommonModule/Script/UIComponent/RemoteSharedImage')
export default class RemoteSharedImage extends Component {
  /** Sprite目標 */
  @property({
    type: Sprite,
    displayName: 'Sprite目標',
    tooltip: '若無指定則嘗試取得節點上的Sprite',
  })
  public spriteTarget: Sprite | null = null;
  /** 圖檔於遠端資源的相對路徑 */
  @property({
    displayName: '圖檔路徑',
    tooltip: '圖檔於遠端資源的相對路徑\n支援格式: jpg, jpeg, png',
  })
  public filePath = '';
  //    /** 是否onLoad時初始化 */
  @property({displayName: 'onLoad時初始化'})
  private isOnLoadInit = true;
  //    /** 是否參與動態合圖 */
  @property({displayName: '參與動態合圖'})
  private isPackable = true;
  @property({displayName: '圖片填充模式', type: Enum(enumFillType)})
  private fillType: enumFillType = enumFillType.FIT_NODE;
  //    /** 是否等比縮放為Sprite尺寸 */
  @property({
    displayName: '等比縮放為Sprite尺寸',
    visible(this: RemoteSharedImage) {
      return this.fillType === enumFillType.FIT_NODE;
    },
  })
  private isFitSize = true;
  /** 遠端圖檔資源路徑 (資源集合中的Key) */
  private remoteImageFilePath = '';
  /** 節點尺寸 */
  private nodeSize: Size | null = null;
  /** 載入後的圖片 canvas（供外部截圖合成使用） */
  private _sourceCanvas: HTMLCanvasElement | null = null;
  public get sourceCanvas(): HTMLCanvasElement | null {
    return this._sourceCanvas;
  }
  onLoad() {
    if (this.isOnLoadInit) this.init();
  }
  onDestroy() {
    this.release();
  }
  /**
   * 初始化RemoteSharedImage
   * @param onInitComplete 初始化完成Callback
   * @param onError 錯誤事件Callback
   * @returns
   */
  public async init(onInitComplete: Function = null, onError: Function = null) {
    //Sprite目標 若無指定則嘗試取得節點上的Sprite
    this.spriteTarget = this.spriteTarget ?? this.node.getComponent(Sprite);
    if (this.spriteTarget === null) {
      console.warn(
        '[RemoteSharedImage] Init spriteTarget is null, path: %s',
        this.getNodePath(this.node)
      );
      return;
    }
    //檔案類型驗證
    if (!this.isValidFileExtension(this.filePath)) {
      console.warn('[RemoteSharedImage] Init fail, invalid file extension');
      return;
    }
    //遠端圖檔資源路徑 (資源集合中的Key)
    if (this.filePath.startsWith('http'))
      this.remoteImageFilePath = this.filePath;
    else
      this.remoteImageFilePath =
        PlatformData.gameConfig.RemoteResources + this.filePath;
    //取得遠端圖片材質
    let remoteTexture: Texture2D = null;
    try {
      await new Promise<Texture2D>((resolve, reject) => {
        this.getRemoteImageTexture(this.isPackable, resolve, reject);
      })
        .then((texture: Texture2D) => {
          remoteTexture = texture;
        })
        .catch((err: Error) => {
          throw err;
        });
    } catch (err) {
      if (err instanceof Error && err.message === 'File Path Different') {
        console.warn('[RemoteSharedImage] Init File Path Different');
        return;
      }
      console.error(
        '[RemoteSharedImage] Init GetRemoteImageTexture error.',
        err
      );
      if (onError !== null) onError(err);
      return;
    }
    //設置SpriteFrame
    this.setSpriteFrame(remoteTexture);
    if (onInitComplete !== null) onInitComplete();
  }
  /**
   * 釋放RemoteSharedImage
   */
  public release() {
    this.nodeSize = null;
  }
  /**
   * 設置Sprite的SpriteFrame
   * @param texture
   */
  private setSpriteFrame(texture: Texture2D) {
    if (texture === null) {
      console.warn('[RemoteSharedImage] SetSpriteFrame texture is null');
      return;
    }
    //取得Sprite節點尺寸
    this.nodeSize = getSize(this.spriteTarget.node);
    //創建 SpriteFrame
    const spriteFrame: SpriteFrame = new SpriteFrame();
    spriteFrame.texture = texture;
    //縮放比例
    let scale = 1;
    //等比縮放
    if (this.isFitSize) {
      //計算spriteFrame與Sprite節點尺寸比例
      const scaleX: number = spriteFrame.originalSize.width / this.nodeSize.x;
      const scaleY: number = spriteFrame.originalSize.height / this.nodeSize.y;
      scale = scaleX > scaleY ? scaleX : scaleY;
    }
    //設置SpriteFrame
    this.spriteTarget.spriteFrame = spriteFrame;
    //調整節點大小
    switch (this.fillType) {
      case enumFillType.FIT_NODE:
        {
          //調整Sprite尺寸
          setSize(
            this.spriteTarget.node,
            getUItrans(this.spriteTarget.node).width / scale,
            getUItrans(this.spriteTarget.node).height / scale
          );
        }
        break;
      case enumFillType.RAW:
        {
          setSize(
            this.spriteTarget.node,
            spriteFrame.rect.size.width,
            spriteFrame.rect.size.height
          );
        }
        break;
    }
  }
  /**
   * 取得遠端圖片材質
   */
  private async getRemoteImageTexture(
    packable: boolean,
    onComplete: (texture2: Texture2D) => void,
    onError: (err) => void
  ) {
    const tempFilePath: string = this.filePath;
    assetManager.loadRemote(
      this.remoteImageFilePath,
      (err, img: ImageAsset) => {
        if (err) {
          onError(err);
          return;
        }
        if (tempFilePath !== this.filePath) {
          onError(new Error('File Path Different'));
          return;
        }
        //返回的材質：透過 canvas 繪製 + uploadData，避免 extractMipmaps 問題
        const imgData = img.data;
        const width = img.width;
        const height = img.height;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgData as CanvasImageSource, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        const retTexture: Texture2D = new Texture2D();
        retTexture.reset({
          width,
          height,
          format: Texture2D.PixelFormat.RGBA8888,
        });
        retTexture.uploadData(new Uint8Array(imageData.data.buffer));

        this._sourceCanvas = canvas;
        onComplete(retTexture);
      }
    );
  }
  /**
   * 是否為有效檔案類型
   */
  private isValidFileExtension(url: string) {
    if (url.includes('?')) url = url.split('?')[0];
    //副檔名
    const fileExtension: string = url
      .split('/')
      .pop()
      .split('.')
      .pop()
      .toLowerCase();
    return /^jpg|jpeg|png$/.test(fileExtension);
  }
  /**
   * 取得節點位於節點樹的完整路徑
   * @param node
   */
  private getNodePath(node: Node): string {
    let path = '';
    while (node && !(node instanceof Scene)) {
      if (path) {
        path = node.name + '/' + path;
      } else {
        path = node.name;
      }
      node = node.parent;
    }
    return path;
  }
}
