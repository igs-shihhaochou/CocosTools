import {
  _decorator,
  Component,
  Camera,
  Sprite,
  Material,
  RenderTexture,
  Node,
  isValid,
  SpriteFrame,
  v2,
  v3,
  director,
  Director,
} from 'cc';
import {getUItrans} from '../../../../CommonModule/Script/Utility/NodeProperty';
import {DEV} from 'cc/env';
const {ccclass, property} = _decorator;

@ccclass('ScreenCapture')
export default class ScreenCapture extends Component {
  @property({type: Camera, tooltip: DEV && '用來照要截圖的鏡頭'})
  protected camera: Camera | null = null;
  @property({
    type: [Camera],
    tooltip: DEV && '用來照要截圖的鏡頭清單，和單個的擇一取用',
  })
  protected cameraList: Array<Camera> = new Array<Camera>();
  @property({
    type: Sprite,
    tooltip: DEV && '空sprite,用來呈現這個鏡頭照到的東西',
  })
  protected sprite: Sprite | null = null;
  @property({type: Material, tooltip: DEV && '掛需要用的shader'})
  protected material: Material | null = null;
  @property({tooltip: DEV && '是否為截圖模式'})
  protected isScreenshotMode = false;
  /**
   * 正在使用的 RenderTexture
   */
  protected renderTexture: RenderTexture | null = null;

  onDestroy() {
    // 銷毀不用的 RenderTexture
    if (this.renderTexture !== null && isValid(this.renderTexture))
      this.renderTexture.destroy();
    this.renderTexture = null;
  }
  public showScreenCapture(): boolean {
    // 目標節點
    const node: Node = this.sprite.node;
    let material: Material = null;
    // 設置材質
    if (this.material !== null) {
      material = this.material;
      if (material.getProperty('resolution', 0) !== null) {
        material.setProperty(
          'resolution',
          v2(getUItrans(node).width, getUItrans(node).height)
        );
      }
    }
    // 創建臨時 RenderTexture
    const srcRenderTexture: RenderTexture = new RenderTexture();
    // 取得初始 RenderTexture
    this.getRenderTexture(node, srcRenderTexture);
    if (this.isScreenshotMode) {
      director.once(Director.EVENT_AFTER_DRAW, () => {
        if (this.camera != null) {
          this.camera.targetTexture = null;
          this.camera.enabled = false;
        }
        if (this.cameraList != null && this.cameraList.length > 0) {
          this.cameraList.forEach(element => {
            element.targetTexture = null;
            element.enabled = false;
          });
        }
        this.setSpriteFrame(srcRenderTexture, node, material);
      });
    } else {
      this.setSpriteFrame(srcRenderTexture, node, material);
    }

    return true;
  }
  public clearScreenCapture() {
    // 復原鏡頭渲染的 RenderTexture 對象
    if (this.camera != null) {
      this.camera.targetTexture = null;
    }
    if (this.cameraList != null && this.cameraList.length > 0) {
      this.cameraList.forEach(element => {
        element.targetTexture = null;
      });
    }
    // 清空 Sprite 的 SpriteFrame
    this.sprite.spriteFrame = null;
    // 銷毀暫存的 RenderTexture
    if (this.renderTexture !== null) this.renderTexture.destroy();
    this.renderTexture = null;
  }
  /**
   * 取得節點的 RenderTexture
   * @param node 節點
   * @param out 輸出的 RenderTexture
   * @see RenderUtil.ts https://gitee.com/ifaswind/eazax-ccc/blob/master/utils/RenderUtil.ts
   */
  protected getRenderTexture(node: Node, out?: RenderTexture): RenderTexture {
    // 檢查參數
    if (!isValid(node)) {
      return null;
    }
    if (!out || !(out instanceof RenderTexture)) {
      out = new RenderTexture();
    }
    // 取得寬高
    const width: number = Math.floor(getUItrans(node).width),
      height: number = Math.floor(getUItrans(node).height);
    // 初始化 RenderTexture
    out.initialize({
      height,
      width,
    });

    // 將節點渲染到到 RenderTexture
    if (this.camera != null) {
      this.camera.targetTexture = out;
      this.camera.enabled = true;
      //this.camera.render(cc.director.getScene());
    }
    if (this.cameraList != null && this.cameraList.length > 0) {
      this.cameraList.forEach(element => {
        element.targetTexture = out;
        element.enabled = true;
        //element.render(cc.director.getScene());
      });
    }
    // 把所有像素的alpha轉成不透明 不然底圖上有疊加透明UI時 截圖時該區塊的透明度會被該UI影響 變成一個洞(可能是透明通道渲染次序的問題)
    // 如果要截的圖沒有這問題就可以把這段拿掉
    const data: Uint8Array = out.readPixels();
    for (let i = 0; i < out.width; i++) {
      for (let j = 0; j < out.height; j++) {
        const alpha: number = i * out.height * 4 + j * 4 + 3;
        data[alpha] = 255;
      }
    }
    // out.initialize({
    //   width: out.width,
    //   height: out.height,
    // });
    // 返回 RenderTexture
    return out;
  }

  private setSpriteFrame(
    srcRenderTexture: RenderTexture,
    node: Node,
    material: Material
  ) {
    // 使用經過處理的 RenderTexture
    this.renderTexture = srcRenderTexture;
    const newSpriteFrame: SpriteFrame = new SpriteFrame();
    newSpriteFrame.texture = this.renderTexture;
    this.sprite.spriteFrame = newSpriteFrame;
    // 由於RenderTexture在UV坐標系的Y軸是反的，所以這邊要把sprite的scaleY設成-1
    node.scale = v3(1, -1, 1);
    if (material !== null) {
      this.sprite.setSharedMaterial(material, 0);
    }
  }
}
