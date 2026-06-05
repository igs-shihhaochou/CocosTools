import {
  Director,
  director,
  game,
  Label,
  Node,
  screen,
  Sprite,
  UITransform,
  Texture2D,
  view,
} from 'cc';

export interface CaptureConfig {
  offsetHeight?: number;
  maxLongSide?: number;
  backgroundSprite?: Sprite;
  screenshotArea?: Node;
  overlays?: Node[];
  backgroundOverlays?: Node[];
  imageFileName?: string;
}

export interface CaptureResult {
  compositeCanvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export class ScreenCaptureUtil {
  /** 手動註冊的 Node → CanvasImageSource 對照表（用於動態產生的圖片） */
  private static _customSources = new WeakMap<Node, CanvasImageSource>();

  /**
   * 為指定節點註冊自訂的圖片來源，供 overlay 繪製使用。
   * 適用於動態產生的 Texture（如 QR Code），其 tex.image.data 可能無法直接取得。
   */
  static setNodeImageSource(node: Node, source: CanvasImageSource): void {
    ScreenCaptureUtil._customSources.set(node, source);
  }

  /**
   * 擷取螢幕畫面，回傳原始 buffer 與螢幕尺寸。
   */
  static captureScreen(): Promise<{
    buffer: Uint8Array;
    width: number;
    height: number;
  } | null> {
    return new Promise(resolve => {
      director.once(Director.EVENT_AFTER_DRAW, () => {
        try {
          const gameCanvas = game.canvas as HTMLCanvasElement;
          if (!gameCanvas) {
            console.error('[ScreenCaptureUtil] Game canvas not found');
            resolve(null);
            return;
          }

          // Use screen.windowSize for consistent dimensions with design resolution
          const windowSize = screen.windowSize;
          const width = Math.floor(windowSize.width);
          const height = Math.floor(windowSize.height);

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const ctx = tempCanvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(gameCanvas, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height);

          resolve({
            buffer: new Uint8Array(imageData.data.buffer),
            width,
            height,
          });
        } catch (err) {
          console.error('[ScreenCaptureUtil] captureScreen failed:', err);
          resolve(null);
        }
      });
    });
  }

  /**
   * 對原始 buffer 做 Y 翻轉、移除左右黑邊、裁切。
   * 若提供 screenshotArea，則只截取該區域對應的畫面。
   * offsetHeight 僅在直版時生效，用來決定截圖中心的偏移量。
   */
  static flipAndCrop(
    buffer: Uint8Array,
    screenW: number,
    screenH: number,
    offsetHeight: number,
    screenshotArea?: Node
  ): {croppedBuffer: Uint8Array; finalWidth: number; finalHeight: number} {
    const designSize = view.getDesignResolutionSize();
    const designAspect = designSize.width / designSize.height;
    const screenAspect = screenW / screenH;

    let srcX = 0;
    let srcWidth = screenW;
    if (screenAspect > designAspect) {
      const visibleWidth = Math.round(screenH * designAspect);
      srcX = Math.round((screenW - visibleWidth) / 2);
      srcWidth = visibleWidth;
    }

    const scale = screenH / designSize.height;
    const isPortrait = screenH >= screenW;
    const scaledOffset = isPortrait ? Math.round(offsetHeight * scale) : 0;

    if (screenshotArea) {
      return ScreenCaptureUtil.cropToArea(
        buffer,
        screenW,
        screenH,
        srcX,
        srcWidth,
        scale,
        scaledOffset,
        screenshotArea
      );
    }

    const offset = Math.min(Math.max(scaledOffset, 0), screenH);

    const finalWidth = srcWidth;
    const finalHeight = screenH - offset;
    const croppedBuffer = new Uint8Array(finalWidth * finalHeight * 4);

    for (let y = 0; y < finalHeight; y++) {
      for (let x = 0; x < finalWidth; x++) {
        const srcIdx = (y * screenW + (srcX + x)) * 4;
        const dstIdx = (y * finalWidth + x) * 4;
        croppedBuffer[dstIdx] = buffer[srcIdx];
        croppedBuffer[dstIdx + 1] = buffer[srcIdx + 1];
        croppedBuffer[dstIdx + 2] = buffer[srcIdx + 2];
        croppedBuffer[dstIdx + 3] = buffer[srcIdx + 3];
      }
    }

    return {croppedBuffer, finalWidth, finalHeight};
  }

  /**
   * 根據 screenshotArea 的實際尺寸，從可見畫面裁切對應大小。
   * offsetBottom: 僅直版時生效，用來決定截圖中心的偏移量。
   */
  private static cropToArea(
    buffer: Uint8Array,
    screenW: number,
    screenH: number,
    srcX: number,
    srcWidth: number,
    scale: number,
    offsetBottom: number,
    areaNode: Node
  ): {croppedBuffer: Uint8Array; finalWidth: number; finalHeight: number} {
    const areaTransform = areaNode.getComponent(UITransform);
    if (!areaTransform) {
      console.error('[ScreenCaptureUtil] screenshotArea missing UITransform');
      return {croppedBuffer: new Uint8Array(4), finalWidth: 1, finalHeight: 1};
    }
    const areaScale = areaNode.scale;
    const csW = areaTransform.contentSize.width;
    const csH = areaTransform.contentSize.height;
    const areaW = csW * Math.abs(areaScale.x);
    const areaH = csH * Math.abs(areaScale.y);

    const areaAspect = areaW / areaH;
    const isPortrait = screenH >= screenW;

    let cropW: number;
    let cropH: number;
    if (isPortrait) {
      // 直版：以寬度為基準
      cropW = srcWidth;
      cropH = Math.round(srcWidth / areaAspect);
    } else {
      // 橫版：以高度為基準
      cropH = screenH;
      cropW = Math.round(screenH * areaAspect);
    }

    const centerX = srcX + srcWidth / 2;
    const left = Math.max(Math.round(centerX - cropW / 2), 0);
    // 直版：從上方裁切（對齊底部）；橫版：垂直置中
    const top = isPortrait
      ? Math.max(screenH - cropH, 0)
      : Math.max(Math.round((screenH - offsetBottom) / 2 - cropH / 2), 0);
    const right = Math.min(left + cropW, screenW);
    const btm = Math.min(top + cropH, screenH);
    const finalWidth = Math.max(right - left, 1);
    const finalHeight = Math.max(btm - top, 1);

    const croppedBuffer = new Uint8Array(finalWidth * finalHeight * 4);

    for (let y = 0; y < finalHeight; y++) {
      const srcY = top + y;
      for (let x = 0; x < finalWidth; x++) {
        const si = (srcY * screenW + (left + x)) * 4;
        const di = (y * finalWidth + x) * 4;
        croppedBuffer[di] = buffer[si];
        croppedBuffer[di + 1] = buffer[si + 1];
        croppedBuffer[di + 2] = buffer[si + 2];
        croppedBuffer[di + 3] = buffer[si + 3];
      }
    }

    return {croppedBuffer, finalWidth, finalHeight};
  }

  /**
   * 將截圖合成到背景圖上。若無背景圖設定則直接回傳原始截圖 canvas。
   */
  static compositeOnBackground(
    screenshotCanvas: HTMLCanvasElement,
    backgroundSprite?: Sprite,
    screenshotArea?: Node,
    overlays?: Node[],
    backgroundOverlays?: Node[]
  ): HTMLCanvasElement {
    if (!backgroundSprite || !screenshotArea) {
      return screenshotCanvas;
    }

    const bgTransform = backgroundSprite.getComponent(UITransform);
    if (!bgTransform) {
      return screenshotCanvas;
    }

    let bgImage: HTMLImageElement | HTMLCanvasElement | null = null;
    if (backgroundSprite.spriteFrame) {
      const bgTexture = backgroundSprite.spriteFrame.texture as Texture2D;
      const data = bgTexture.image?.data;
      if (
        data instanceof HTMLImageElement ||
        data instanceof HTMLCanvasElement
      ) {
        bgImage = data;
      }
    }

    const bgWidth = bgTransform.contentSize.width;
    const bgHeight = bgTransform.contentSize.height;

    const bgBB = bgTransform.getBoundingBoxToWorld();
    const pxScaleX = bgWidth / bgBB.width;
    const pxScaleY = bgHeight / bgBB.height;

    const areaTransform = screenshotArea.getComponent(UITransform);
    const areaScale = screenshotArea.scale;
    const areaCS = areaTransform.contentSize;
    const actualAreaW = areaCS.width * Math.abs(areaScale.x);
    const actualAreaH = areaCS.height * Math.abs(areaScale.y);

    const areaWorldPos = screenshotArea.worldPosition;
    const areaPxX = (areaWorldPos.x - bgBB.x) * pxScaleX;
    const areaOffY = bgBB.y + bgBB.height - areaWorldPos.y;
    const areaPxY = areaOffY * pxScaleY;
    const drawW = actualAreaW * pxScaleX;
    const drawH = actualAreaH * pxScaleY;
    const drawX = areaPxX - drawW / 2;
    const drawY = areaPxY - drawH / 2;
    const rotDeg = -screenshotArea.eulerAngles.z;
    const rotRad = (rotDeg * Math.PI) / 180;

    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = bgWidth;
    compositeCanvas.height = bgHeight;
    const ctx = compositeCanvas.getContext('2d')!;

    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, bgWidth, bgHeight);
    }

    // 繪製截圖到 screenshotArea（cover 模式，填滿整個區域）
    const imgW = screenshotCanvas.width;
    const imgH = screenshotCanvas.height;
    const fitScale = Math.max(drawW / imgW, drawH / imgH);
    const fitW = imgW * fitScale;
    const fitH = imgH * fitScale;

    const centerX = drawX + drawW / 2;
    const centerY = drawY + drawH / 2;
    // 繪製截圖（clip 限制在 screenshotArea 內）
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotRad);
    ctx.beginPath();
    ctx.rect(-drawW / 2, -drawH / 2, drawW, drawH);
    ctx.clip();
    ctx.drawImage(screenshotCanvas, -fitW / 2, -fitH / 2, fitW, fitH);
    ctx.restore();

    // 繪製 overlays（不受 clip 影響）
    if (overlays) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotRad);
      ScreenCaptureUtil.drawOverlays(
        ctx,
        overlays,
        drawW,
        drawH,
        pxScaleX,
        pxScaleY
      );
      ctx.restore();
    }

    // 繪製 backgroundOverlays（背景座標系）
    if (backgroundOverlays) {
      ScreenCaptureUtil.drawBackgroundOverlays(
        ctx,
        backgroundOverlays,
        bgBB,
        pxScaleX,
        pxScaleY
      );
    }

    return compositeCanvas;
  }

  /**
   * 在背景座標系內繪製 overlay，使用世界座標轉換為背景像素座標。
   */
  private static drawBackgroundOverlays(
    ctx: CanvasRenderingContext2D,
    overlays: Node[],
    bgBB: {x: number; y: number; width: number; height: number},
    pxScaleX: number,
    pxScaleY: number
  ) {
    for (const nd of overlays) {
      if (!nd?.isValid || !nd.active) continue;

      const img = ScreenCaptureUtil.getNodeImage(nd);
      if (!img) continue;

      const transform = nd.getComponent(UITransform);
      if (!transform) continue;

      const s = nd.scale;
      const cs = transform.contentSize;
      const worldPos = nd.worldPosition;
      const ax = transform.anchorX;
      const ay = transform.anchorY;

      const ox = (worldPos.x - bgBB.x) * pxScaleX;
      const oy = (bgBB.y + bgBB.height - worldPos.y) * pxScaleY;
      const dw = cs.width * Math.abs(s.x) * pxScaleX;
      const dh = cs.height * Math.abs(s.y) * pxScaleY;
      const drawX = -ax * dw;
      const drawY = -(1 - ay) * dh;
      const rot = (-nd.eulerAngles.z * Math.PI) / 180;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(rot);
      ctx.drawImage(img, drawX, drawY, dw, dh);
      ctx.restore();
    }
  }

  /**
   * 在 screenshotArea 座標系內繪製 overlay。
   * overlay 是 screenshotArea 的子節點，用 position（局部座標）定位。
   */
  private static drawOverlays(
    ctx: CanvasRenderingContext2D,
    overlays: Node[],
    areaDrawW: number,
    areaDrawH: number,
    pxScaleX: number,
    pxScaleY: number
  ) {
    for (const nd of overlays) {
      if (!nd?.isValid || !nd.active) continue;

      const img = ScreenCaptureUtil.getNodeImage(nd);
      if (!img) continue;

      const transform = nd.getComponent(UITransform);
      if (!transform) continue;

      const s = nd.scale;
      const cs = transform.contentSize;
      const pos = nd.position;
      const ax = transform.anchorX;
      const ay = transform.anchorY;

      const ox = pos.x * pxScaleX;
      const oy = -pos.y * pxScaleY;
      const dw = cs.width * Math.abs(s.x) * pxScaleX;
      const dh = cs.height * Math.abs(s.y) * pxScaleY;
      const drawX = -ax * dw;
      const drawY = -(1 - ay) * dh;
      const rot = (-nd.eulerAngles.z * Math.PI) / 180;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(rot);
      ctx.drawImage(img, drawX, drawY, dw, dh);
      ctx.restore();
    }
  }

  /**
   * 從 Node 取得可繪製的圖片（支援 Sprite 和 Label）。
   */
  private static getNodeImage(nd: Node): CanvasImageSource | null {
    // 優先使用手動註冊的自訂來源
    const custom = ScreenCaptureUtil._customSources.get(nd);
    if (custom) return custom;

    // 嘗試 Sprite
    const sprite = nd.getComponent(Sprite);
    if (sprite?.spriteFrame) {
      const tex = sprite.spriteFrame.texture as Texture2D;
      const data = tex.image?.data;
      if (ScreenCaptureUtil.isDrawableSource(data)) {
        return data;
      }
    }

    // 嘗試 Label（內部渲染的 texture）
    const label = nd.getComponent(Label);
    if (label) {
      return ScreenCaptureUtil.getLabelImage(label);
    }

    return null;
  }

  private static isDrawableSource(data: unknown): data is CanvasImageSource {
    return (
      data instanceof HTMLImageElement ||
      data instanceof HTMLCanvasElement ||
      (typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap) ||
      (typeof OffscreenCanvas !== 'undefined' &&
        data instanceof OffscreenCanvas)
    );
  }

  /**
   * 從 Label 取得內部渲染的 canvas/image。
   */
  private static getLabelImage(label: Label): CanvasImageSource | null {
    // Label 的 spriteFrame 包含渲染後的文字 texture
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assembler = (label as any)._assembler;
    if (!assembler) return null;

    // system font / TTF: assembler 內部有 _canvas
    const canvas = assembler._canvas;
    if (canvas instanceof HTMLCanvasElement) {
      return canvas;
    }

    // 回退：嘗試從 spriteFrame 取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sf = (label as any).spriteFrame;
    if (sf?.texture) {
      const tex = sf.texture as Texture2D;
      const data = tex.image?.data;
      if (ScreenCaptureUtil.isDrawableSource(data)) {
        return data;
      }
    }

    return null;
  }

  /**
   * 從 buffer 建立截圖 canvas，合成背景後回傳 canvas。
   */
  static createCompositeCanvas(
    croppedBuffer: Uint8Array,
    finalWidth: number,
    finalHeight: number,
    backgroundSprite?: Sprite,
    screenshotArea?: Node,
    overlays?: Node[],
    backgroundOverlays?: Node[]
  ): HTMLCanvasElement {
    const screenshotCanvas = document.createElement('canvas');
    screenshotCanvas.width = finalWidth;
    screenshotCanvas.height = finalHeight;
    const sCtx = screenshotCanvas.getContext('2d')!;
    const imageData = sCtx.createImageData(finalWidth, finalHeight);
    imageData.data.set(croppedBuffer);
    sCtx.putImageData(imageData, 0, 0);

    return ScreenCaptureUtil.compositeOnBackground(
      screenshotCanvas,
      backgroundSprite,
      screenshotArea,
      overlays,
      backgroundOverlays
    );
  }

  /**
   * 將 canvas 內容轉為 Texture2D 並回傳。
   */
  static canvasToRenderTexture(canvas: HTMLCanvasElement): Texture2D | null {
    try {
      const width = canvas.width;
      const height = canvas.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const imageData = ctx.getImageData(0, 0, width, height);
      const texture = new Texture2D();
      texture.reset({
        width,
        height,
        format: Texture2D.PixelFormat.RGBA8888,
      });
      texture.uploadData(new Uint8Array(imageData.data.buffer));
      return texture;
    } catch {
      return null;
    }
  }

  /**
   * 將 canvas 轉為 File。
   */
  static canvasToFile(
    canvas: HTMLCanvasElement,
    fileName: string
  ): Promise<File | null> {
    return new Promise(resolve => {
      canvas.toBlob(
        blob => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(new File([blob], fileName, {type: 'image/png'}));
        },
        'image/png',
        1.0
      );
    });
  }

  /**
   * 將 canvas 縮放到指定尺寸。
   */
  static resizeCanvas(
    source: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number
  ): HTMLCanvasElement {
    const resized = document.createElement('canvas');
    resized.width = targetWidth;
    resized.height = targetHeight;
    const ctx = resized.getContext('2d')!;
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    return resized;
  }

  /**
   * 一站式截圖：擷取螢幕 → 翻轉裁切 → 合成背景 → (可選)縮放至固定尺寸 → 回傳結果。
   */
  static async capture(config: CaptureConfig): Promise<CaptureResult | null> {
    const raw = await ScreenCaptureUtil.captureScreen();
    if (!raw) return null;

    const {croppedBuffer, finalWidth, finalHeight} =
      ScreenCaptureUtil.flipAndCrop(
        raw.buffer,
        raw.width,
        raw.height,
        config.offsetHeight ?? 0,
        config.screenshotArea
      );

    let compositeCanvas = ScreenCaptureUtil.createCompositeCanvas(
      croppedBuffer,
      finalWidth,
      finalHeight,
      config.backgroundSprite,
      config.screenshotArea,
      config.overlays,
      config.backgroundOverlays
    );

    const maxSide = config.maxLongSide;
    if (maxSide && maxSide > 0) {
      const w = compositeCanvas.width;
      const h = compositeCanvas.height;
      const longSide = Math.max(w, h);
      if (longSide > maxSide) {
        const ratio = maxSide / longSide;
        compositeCanvas = ScreenCaptureUtil.resizeCanvas(
          compositeCanvas,
          Math.round(w * ratio),
          Math.round(h * ratio)
        );
      }
    }

    return {
      compositeCanvas,
      width: compositeCanvas.width,
      height: compositeCanvas.height,
    };
  }
}
