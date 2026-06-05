import {
  _decorator,
  Component,
  Node,
  Mask,
  Graphics,
  Color,
  math,
  UITransform,
} from 'cc';
import {waitForSecondsByTimeOut} from '../../../../../CommonModule/Script/ExtraType';
const {ccclass, property} = _decorator;

@ccclass('RoundMaskCtrl')
export class RoundMaskCtrl extends Component {
  @property({type: Node, tooltip: '帶有 Sprite 的圖片節點'})
  public target: Node = null;

  @property({tooltip: '起始角度偏移 (度)', range: [0, 360]})
  public startAngle = 90;

  @property({tooltip: '是否為順時針方向'})
  public clockwise = true;

  private _maskNode: Node = null;
  private _graphics: Graphics = null;
  private _percentage = 100;
  private _radius = 0;

  protected onLoad(): void {
    this.setupMaskNode();
    window['RoundMaskCtrl'] = this;
  }

  protected start(): void {
    // 延遲到 start 確保 Mask 的 Graphics 已建立
    this._graphics = this._maskNode.getComponent(Graphics);
    if (this._graphics) {
      this._graphics.fillColor = Color.WHITE;
    }
    this.drawSector(this._percentage);
  }

  private setupMaskNode(): void {
    if (!this.target) {
      this.target = this.node;
    }

    const uiTransform = this.target.getComponent(UITransform);
    if (uiTransform) {
      this._radius = Math.max(uiTransform.width, uiTransform.height) / 2;
    }

    // 建立一個中間 mask 節點，包住原本的 Sprite 子節點
    this._maskNode = new Node('SectorMask');
    this.target.parent.insertChild(
      this._maskNode,
      this.target.getSiblingIndex()
    );
    this._maskNode.setPosition(this.target.position);

    // 設定 mask 節點的 UITransform 與原節點一致
    const maskTransform = this._maskNode.addComponent(UITransform);
    if (uiTransform) {
      maskTransform.setContentSize(uiTransform.contentSize);
      maskTransform.setAnchorPoint(uiTransform.anchorPoint);
    }

    // 加入 Mask 元件（GRAPHICS_STENCIL 會自動建立 Graphics）
    const mask = this._maskNode.addComponent(Mask);
    mask.type = Mask.Type.GRAPHICS_STENCIL;
    mask.inverted = true;

    // 把原本的圖片節點移進 mask 節點下
    this.target.setPosition(0, 0);
    this.target.parent = this._maskNode;
  }

  /**
   * 設定扇形比例
   * @param percentage 0~100 的比例值
   */
  public setPercentage(percentage: number): void {
    this._percentage = math.clamp(percentage, 0, 100);
    this.drawSector(this._percentage);
  }

  public getPercentage(): number {
    return this._percentage;
  }

  /**
   * Demo: 播放 0~100 的動畫
   * @param duration 動畫時長（秒），預設 2
   */
  public async playDemo(duration = 2): Promise<void> {
    this._demoRunning = false;
    await waitForSecondsByTimeOut(0);
    this._demoRunning = true;
    let lastTime = Date.now();
    let elapsed = 0;
    while (this._demoRunning) {
      await waitForSecondsByTimeOut(0);
      if (!this._demoRunning) break;
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      elapsed += dt;
      const t = math.clamp01(elapsed / duration);
      this.setPercentage(t * 100);
      if (t >= 1) {
        this._demoRunning = false;
      }
    }
  }

  private _demoRunning = false;

  private _countdownRunning = false;
  private _countdownPaused = false;
  private _countdownElapsed = 0;
  private _countdownDuration = 0;
  private _countdownFill = true;
  private _countdownClockwise = true;

  /**
   * 倒數動畫，可獨立設定方向與填滿/消失
   * @param duration 動畫秒數
   * @param fill true = 填滿（0→100），false = 消失（100→0）
   * @param isClockwise true = 順時針，false = 逆時針
   * @returns Promise，動畫結束時 resolve
   */
  public async startCountdown(
    duration: number,
    fill = true,
    isClockwise = true
  ): Promise<void> {
    this.stopCountdown();
    this._countdownDuration = duration;
    this._countdownElapsed = 0;
    this._countdownPaused = false;
    this._countdownFill = fill;
    this._countdownClockwise = isClockwise;
    this.clockwise = isClockwise;
    this._countdownRunning = true;

    let lastTime = Date.now();
    while (this._countdownRunning) {
      await waitForSecondsByTimeOut(0);
      if (!this._countdownRunning) break;
      if (this._countdownPaused) {
        lastTime = Date.now();
        continue;
      }
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      this._countdownElapsed += dt;
      const t = math.clamp01(this._countdownElapsed / this._countdownDuration);
      const pct = this._countdownFill ? t * 100 : (1 - t) * 100;
      this.setPercentage(pct);
      if (t >= 1) {
        this.setPercentage(this._countdownFill ? 0 : 100);
        this._countdownRunning = false;
      }
    }
  }

  /** 暫停倒數 */
  public pauseCountdown(): void {
    this._countdownPaused = true;
  }

  /** 繼續倒數 */
  public resumeCountdown(): void {
    this._countdownPaused = false;
  }

  /** 停止倒數 */
  public stopCountdown(): void {
    this._countdownRunning = false;
  }

  /** 重新開始倒數（使用上次的參數） */
  public restartCountdown(): Promise<void> {
    return this.startCountdown(
      this._countdownDuration,
      this._countdownFill,
      this._countdownClockwise
    );
  }

  private drawSector(percentage: number): void {
    if (!this._graphics) return;

    this._graphics.clear();

    // 0% = 完全不顯示，100% = 完全顯示
    if (percentage <= 0) return;

    if (percentage >= 100) {
      this._graphics.circle(0, 0, this._radius);
      this._graphics.fill();
      return;
    }

    const sweepDeg = (percentage / 100) * 360;
    const startRad = math.toRadian(this.startAngle);
    const sign = this.clockwise ? 1 : -1;
    const endRad = startRad + sign * math.toRadian(sweepDeg);

    this._graphics.moveTo(0, 0);
    this._graphics.arc(0, 0, this._radius, startRad, endRad, !this.clockwise);
    this._graphics.lineTo(0, 0);
    this._graphics.close();
    this._graphics.fill();
  }
}
