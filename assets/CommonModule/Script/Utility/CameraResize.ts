import {
  _decorator,
  Component,
  Camera,
  view,
  screen,
  macro,
  renderer,
  sys,
} from 'cc';
import {PlatformData} from '../Define/PlatformData';
import Functions from './Functions';

const {ccclass} = _decorator;

@ccclass('CameraResize')
export class CameraResize extends Component {
  private camera = null as Camera;
  private hypotenuse = -1;

  private resizeEvent;
  onLoad() {
    this.resizeEvent = this.onResize.bind(this);
    this.camera = this.getComponent(Camera);
    addEventListener('resize', this.resizeEvent);
    addEventListener('fullscreenchange', this.resizeEvent);
    addEventListener('orientationchange', this.resizeEvent);
  }

  onDestroy() {
    this.camera = null;
    removeEventListener('resize', this.resizeEvent);
    removeEventListener('fullscreenchange', this.resizeEvent);
    removeEventListener('orientationchange', this.resizeEvent);
  }

  start() {
    this.onResize();
  }

  onResize() {
    this.scheduleOnce(() => {
      console.log(
        '[cameraResize]onResize',
        Functions.getOrientation().includes('landscape'),
        PlatformData.gameSetting?.IsSupportPortrait === true,
        PlatformData.gameSetting?.IsSupportLandscape === false
      );
      if (
        Functions.getOrientation().includes('landscape') &&
        PlatformData.gameSetting?.IsSupportPortrait === true &&
        PlatformData.gameSetting?.IsSupportLandscape === false &&
        sys.isMobile
      ) {
        let parentRotate = '';
        // playgd 需要特殊處理，因為 playgd 的 iframe 是旋轉 90 度的
        if (PlatformData.showLogo === 'playgd') {
          try {
            parentRotate =
              window.parent?.document?.getElementById('Cocos2dGameContainer')
                ?.style?.transform || '';
          } catch (e) {
            // cross-origin iframe, cannot access parent document
          }
        }
        const isParentRotatedMinus90 = parentRotate.includes('rotate(-90deg)');
        console.log('cameraResize flip, parentRotate:', parentRotate);
        if (!isParentRotatedMinus90) {
          this.camera.node.setRotation(0, 0, 180, 1);
        } else {
          this.camera.node.setRotation(0, 0, 0, 1);
        }
      } else {
        console.log('cameraResize unflip');
        this.camera.node.setRotation(0, 0, 0, 1);
      }

      if (this.camera.projection === Camera.ProjectionType.ORTHO)
        this.orthoResize();
      else this.perspectiveResize(); // 修正攝影機的 FOV, 讓 3D 場景的寬度比例維持一致
    });
  }

  private orthoResize() {
    const camera = this.camera;
    const winSize = screen.windowSize;
    camera.orthoHeight = winSize.height / view.getScaleY() / 2;
  }

  private perspectiveResize() {
    const camera = this.camera;

    if (this.hypotenuse === -1)
      this.hypotenuse = Math.tan((camera.fov / 2) * macro.RAD);

    const designSize = view.getDesignResolutionSize();
    const aspect = designSize.width / designSize.height;
    let mag = 1;

    if (screen.windowSize.width / screen.windowSize.height <= aspect) {
      const w = screen.windowSize.width / screen.devicePixelRatio;
      const h = screen.windowSize.height / screen.devicePixelRatio;
      mag = w / (h * aspect);
    }

    const newHypotenuse = this.hypotenuse / mag;
    const newFov = (Math.atan(newHypotenuse) / macro.RAD) * 2;
    camera.fovAxis = renderer.scene.CameraFOVAxis.VERTICAL; // 固定垂直方向比例不變
    camera.fov = newFov;
  }
}
