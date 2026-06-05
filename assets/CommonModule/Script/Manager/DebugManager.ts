import {
  _decorator,
  color,
  Component,
  Director,
  director,
  find,
  game,
  Label,
  Layers,
  Node,
  profiler,
  UIOpacity,
  UITransform,
  view,
} from 'cc';
import {DEBUG} from 'cc/env';

const {ccclass} = _decorator;

/** 保留除錯項目個數 */
const RETAINED_DEBUG_ITEM_COUNT = 2;

@ccclass('DebugManager')
export default class DebugManager extends Component implements DebugPanel {
  //#region Singleton
  //=======================================================
  /** 取得 Singleton 物件實體 */
  public static get instance() {
    return this._instance;
  }
  /** Instance 實體 */
  private static _instance: DebugManager = null;
  //=======================================================
  //#endregion Singleton

  /** 主面板 */
  private panel: Tweakpane.Pane = null;
  /** 主容器，只有在iframe模式下才會記錄 */
  private rootContainer: HTMLDivElement = null;

  /** Cocos效能資訊 */
  private ccProfiler: {
    DrawCalls: number;
    FPS: number;
    FrameTime: number;
    GameLogic: number;
    Renderer: number;
  } = null;

  /** 綁定按下按鍵事件 */
  private bindOnKeyDown: (evt: KeyboardEvent) => void = null;
  /** 響應 window 'pagehide' 或 'unload' 事件的處理函式 */
  private bindRelease: () => void = null;
  /** 響應 window 'beforeunload' 事件的處理函式，用於關閉彈出視窗 */
  private bindBeforeUnload: () => void = null;

  /** 快捷鍵事件 */
  private hotKeyEvent: {[key: string]: Function} = null;

  /** 是否已初始化 */
  private isInit = false;

  //#region Cocos Profiler Optimize
  /** Profiler 自定義節點 */
  private customProfilerNode: Node = null;
  /** 監控容器尺寸變化的觀測器 */
  private resizeObserver: ResizeObserver = null;
  /** 移動 Profiler 節點到 Canvas 的函數 */
  private moveProfilerNodeToCanvas: () => void = null;
  /** 原始的 profiler.showStats 方法 */
  private originalShowStats: () => void = null;
  /** 原始的 profiler.hideStats 方法 */
  private originalHideStats: () => void = null;
  /** 原始的 profiler.isShowingStats 方法 */
  private originalIsShowingStats: () => boolean = null;
  /** 追蹤 profiler 的顯示狀態 */
  private profilerShowingState = false;
  /** 停止 shader 渲染的監聽器 */
  private stopShaderRenderHandler: () => void = null;
  /** 自定義 Profiler 數據更新監聽器 */
  private profilerUpdateHandler: () => void = null;
  /** 緩存的原始 native profiler 節點 */
  private cachedNativeProfilerNode: Node = null;
  //#endregion Cocos Profiler Optimize

  protected override onLoad() {
    if (DebugManager._instance != null) {
      this.node.destroy();
      return;
    }
    DebugManager._instance = this;
  }

  protected override onDestroy() {
    this.release();
  }

  public init() {
    if (this.isInit) {
      console.warn('[DebugManager] already initialized');
      return;
    }

    if (typeof Tweakpane === 'undefined') {
      console.debug('[DebugManager] init Tweakpane is undefined');
      return;
    }

    if (!DEBUG && !profiler) {
      console.debug('[DebugManager] init DebugMode is false');
      return;
    }

    console.debug('[DebugManager] init DebugMode');

    let targetDocument = window.document;
    // 是否用 iframe 方式開啟
    if (window.parent && window.parent !== window) {
      // 有可能因為跨域取不到父視窗的 document
      try {
        targetDocument = window.parent.document;
        // 由於會掛在遊戲iframe外，須保存並手動清除
        this.rootContainer = this.createRootContainer(targetDocument);
      } catch (error) {
        console.warn(
          '[DebugManager] Could not access parent document due to cross-origin restrictions. Creating panel inside the game frame.'
        );
      }
    }

    this.panel = new Tweakpane.Pane({
      title: '\u{1F41E}',
      container: this.rootContainer
        ? this.rootContainer
        : this.createRootContainer(targetDocument),
      document: targetDocument,
    });
    this.panel.expanded = false;

    this.ccProfiler = {
      DrawCalls: 0,
      FPS: 0,
      FrameTime: 0,
      GameLogic: 0,
      Renderer: 0,
    };
    this.hotKeyEvent = {};

    //優化 Cocos Profiler
    this.optimizeProfiler();

    this.createDisplayStatsPanel();

    this.bindOnKeyDown = this.onKeyDown.bind(this);
    game.canvas.addEventListener('keydown', this.bindOnKeyDown);

    this.bindRelease = this.release.bind(this);
    window.addEventListener('pagehide', this.bindRelease, {
      once: true,
    });
    window.addEventListener('unload', this.bindRelease, {
      once: true,
    });

    this.isInit = true;
  }

  public release() {
    game.canvas.removeEventListener('keydown', this.bindOnKeyDown);
    this.bindOnKeyDown = null;

    window.removeEventListener('pagehide', this.bindRelease);
    window.removeEventListener('unload', this.bindRelease);
    if (this.bindBeforeUnload) {
      window.removeEventListener('beforeunload', this.bindBeforeUnload);
      this.bindBeforeUnload = null;
    }

    if (this.panel != null) this.panel.dispose();
    this.panel = null;

    this.releaseRootContainer();

    this.ccProfiler = null;

    // 取消所有排程中的回呼 (例如 scheduleOnce)
    this.unscheduleAllCallbacks();

    // 取消場景啟動事件監聽
    if (this.moveProfilerNodeToCanvas) {
      director.off(
        Director.EVENT_AFTER_SCENE_LAUNCH,
        this.moveProfilerNodeToCanvas,
        this
      );
      this.moveProfilerNodeToCanvas = null;
    }

    // 停止監控尺寸變化
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // 停止持續監聽原生節點隱藏
    director.off(
      Director.EVENT_AFTER_UPDATE,
      this.hideNativeProfilerNode,
      this
    );
    // 停止自定義數據更新監聽
    if (this.profilerUpdateHandler) {
      director.off(
        Director.EVENT_AFTER_UPDATE,
        this.profilerUpdateHandler,
        this
      );
      this.profilerUpdateHandler = null;
    }
    // 停止 shader 渲染監聽
    if (this.stopShaderRenderHandler) {
      director.off(
        Director.EVENT_BEFORE_DRAW,
        this.stopShaderRenderHandler,
        this
      );
      this.stopShaderRenderHandler = null;
    }

    // 恢復原始的 profiler 方法
    if (this.originalShowStats) {
      profiler.showStats = this.originalShowStats;
      this.originalShowStats = null;
    }
    if (this.originalHideStats) {
      profiler.hideStats = this.originalHideStats;
      this.originalHideStats = null;
    }
    if (this.originalIsShowingStats) {
      profiler.isShowingStats = this.originalIsShowingStats;
      this.originalIsShowingStats = null;
    }

    // 清理自定義 Profiler 節點
    if (this.customProfilerNode && this.customProfilerNode.isValid) {
      this.customProfilerNode.destroy();
    }
    this.customProfilerNode = null;

    if (this.hotKeyEvent != null) {
      for (const key in this.hotKeyEvent) {
        this.hotKeyEvent[key] = undefined;
        delete this.hotKeyEvent[key];
      }
    }
    this.hotKeyEvent = null;

    this.isInit = false;

    DebugManager._instance = null;
  }

  private releaseRootContainer() {
    if (this.rootContainer != null && this.rootContainer.parentElement) {
      this.rootContainer.parentElement.removeChild(this.rootContainer);
      this.rootContainer = null;
    }
  }

  /**
   * 顯示或隱藏面板
   * @param isShow
   */
  public show(isShow = true) {
    if (this.panel == null) return;

    this.panel.hidden = !isShow;
  }

  /**
   * 清除面板 (保留共用)
   * @param force 是否強制清除所有項目。預設為false，會保留除錯項目個數
   */
  public clear(force = false) {
    if (this.panel == null) return;

    this.panel.children.forEach(
      (
        view: Tweakpane.BladeApi<Tweakpane.BladeController<Tweakpane.View>>,
        index: number
      ) => {
        //保留共用
        if (index < RETAINED_DEBUG_ITEM_COUNT && !force) return;

        view.dispose();
        this.panel.remove(view);
      }
    );

    if (this.hotKeyEvent != null) {
      for (const key in this.hotKeyEvent) {
        this.hotKeyEvent[key] = undefined;
        delete this.hotKeyEvent[key];
      }
    }
  }

  /**
   * 是否已初始化
   */
  public get IsInit(): boolean {
    return this.isInit;
  }

  //#region Implements
  public createFolder(
    name: string,
    isExpanded = true,
    onFold?: (isExpanded: boolean) => void
  ): DebugPanelFolder {
    return this.createUnitFolder(this.panel, name, isExpanded, onFold);
  }

  public createTab(
    nameList: Array<string>,
    onSelect?: (pageIndex: number) => void
  ): Array<DebugPanel> {
    return this.createUnitTab(this.panel, nameList, onSelect);
  }

  public createSeparator() {
    this.createUnitSeparator(this.panel);
  }

  public createInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onChange?: (value: string | number | boolean) => void
  ) {
    this.createUnitInputBinding(
      this.panel,
      object,
      objectKey,
      label,
      onFormat,
      onChange
    );
  }

  public createSliderInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    min: number,
    max: number,
    step?: number,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onChange?: (value: number) => void
  ) {
    this.createUnitSliderInputBinding(
      this.panel,
      object,
      objectKey,
      min,
      max,
      step,
      label,
      onFormat,
      onChange
    );
  }

  public createListInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    list: {[itemName: string]: string | number},
    label?: string,
    onChange?: (value: string | number) => void
  ) {
    this.createUnitListInputBinding(
      this.panel,
      object,
      objectKey,
      list,
      label,
      onChange
    );
  }

  public createPointInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    label?: string,
    xParams?: {max?: number; min?: number; step?: number},
    yParams?: {max?: number; min?: number; step?: number},
    isInline = false,
    isExpanded = false
  ) {
    this.createUnitPointInputBinding(
      this.panel,
      object,
      objectKey,
      label,
      xParams,
      yParams,
      isInline,
      isExpanded
    );
  }

  public createMonitor<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    interval?: number,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onUpdate?: (value: string | number | boolean) => void
  ) {
    this.createUnitMonitor(
      this.panel,
      object,
      objectKey,
      interval,
      label,
      onFormat,
      onUpdate
    );
  }

  public createGraphMonitor<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    min: number,
    max: number,
    interval?: number,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onUpdate?: (value: number) => void
  ) {
    this.createUnitGraphMonitor(
      this.panel,
      object,
      objectKey,
      min,
      max,
      interval,
      label,
      onFormat,
      onUpdate
    );
  }

  public createButton(
    buttonName: string,
    onClick: () => void,
    hotKey?: string
  ): DebugPanelButton {
    return this.createUnitButton(this.panel, buttonName, onClick, hotKey);
  }

  public createStateButton(
    buttonName: string,
    stateList: Array<string>,
    onClick: (state: number) => void,
    hotKey?: string,
    defaultState?: number
  ): DebugPanelButton {
    return this.createUnitStateButton(
      this.panel,
      buttonName,
      stateList,
      onClick,
      hotKey,
      defaultState
    );
  }

  public createList(
    itemList: Array<string>,
    onSelect: (item: string | number) => void,
    listName?: string,
    defaultItem?: string | number
  ) {
    this.createUnitList(this.panel, itemList, onSelect, listName, defaultItem);
  }
  //#endregion Implements

  //#region Unit
  private createUnitFolder(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi,
    name: string,
    isExpanded = true,
    onFold?: (isExpanded: boolean) => void
  ): DebugPanelFolder {
    if (this.panel == null) return;

    target = target || this.panel;

    const folder = target.addFolder({
      title: name,
      expanded: isExpanded != null ? isExpanded : undefined,
    });

    if (onFold)
      folder.on('fold', (evt: Tweakpane.TpFoldEvent) => {
        onFold(evt.expanded);
      });

    const debugPanelFolder: DebugPanelFolder = this.createDebugPanel(
      folder
    ) as DebugPanelFolder;
    Object.defineProperty(debugPanelFolder, 'IsExpanded', {
      get(): boolean {
        return folder.expanded;
      },
      set(value: boolean) {
        folder.expanded = value;
      },
    });
    debugPanelFolder.clear = () => {
      folder.children.forEach(
        (
          view: Tweakpane.BladeApi<Tweakpane.BladeController<Tweakpane.View>>
        ) => {
          view.dispose();
        }
      );
    };
    return debugPanelFolder;
  }

  private createUnitTab(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi,
    nameList: Array<string>,
    onSelect?: (pageIndex: number) => void
  ): Array<DebugPanel> {
    if (this.panel == null) return;

    target = target || this.panel;

    if (this.panel == null) return;

    const tab = target.addTab({
      pages: nameList.map((name: string) => {
        return {title: name};
      }),
    });

    if (onSelect)
      tab.on('select', (evt: Tweakpane.TpTabSelectEvent) => {
        onSelect(evt.index);
      });

    return tab.pages.map((page: Tweakpane.TabPageApi) =>
      this.createDebugPanel(page)
    );
  }

  private createUnitSeparator(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi
  ) {
    if (this.panel == null) return;

    target = target || this.panel;

    target.addSeparator();
  }

  private createUnitInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi,
    object: O,
    objectKey: K,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onChange?: (value: string | number | boolean) => void
  ) {
    if (this.panel == null) return;

    const value: string | number | boolean = object[objectKey];
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      console.error(
        '[DebugManager] createUnitInputBinding type of object[key] not match (string | number | boolean).',
        object,
        objectKey
      );
      return;
    }

    target = target || this.panel;

    const input = target.addInput(object, objectKey, {
      label: label != null ? label : undefined,
      format: onFormat ? onFormat : undefined,
    } as Tweakpane.InputParams);

    if (onChange)
      input.on(
        'change',
        (evt: Tweakpane.TpChangeEvent<string | number | boolean>) => {
          onChange(evt.value);
        }
      );
  }

  private createUnitSliderInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi,
    object: O,
    objectKey: K,
    min: number,
    max: number,
    step?: number,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onChange?: (value: number) => void
  ) {
    if (this.panel == null) return;

    const value: number = object[objectKey];
    if (typeof value !== 'number') {
      console.error(
        '[DebugManager] createUnitSliderInputBinding type of object[key] not match (number).',
        object,
        objectKey
      );
      return;
    }

    target = target || this.panel;

    const input = target.addInput(object, objectKey, {
      label: label != null ? label : undefined,
      min: min,
      max: max,
      step: step != null ? step : undefined,
      format: onFormat ? onFormat : undefined,
    } as Tweakpane.NumberInputParams);

    if (onChange)
      input.on('change', (evt: Tweakpane.TpChangeEvent<number>) => {
        onChange(evt.value);
      });
  }

  private createUnitListInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi,
    object: O,
    objectKey: K,
    list: {[itemName: string]: string | number},
    label?: string,
    onChange?: (value: string | number) => void
  ) {
    if (this.panel == null) return;

    const value: string | number = object[objectKey];
    if (typeof value !== 'string' && typeof value !== 'number') {
      console.error(
        '[DebugManager] createUnitListInputBinding type of object[key] not match (string | number).',
        object,
        objectKey
      );
      return;
    }

    target = target || this.panel;

    const input = target.addInput(object, objectKey, {
      label: label != null ? label : undefined,
      options: list,
    } as Tweakpane.InputParams);

    if (onChange)
      input.on('change', (evt: Tweakpane.TpChangeEvent<string | number>) => {
        onChange(evt.value);
      });
  }

  private createUnitPointInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi,
    object: O,
    objectKey: K,
    label?: string,
    xParams?: Tweakpane.PointDimensionParams,
    yParams?: Tweakpane.Point2dYParams,
    isInline = false,
    isExpanded = false
  ) {
    if (this.panel == null) return;

    const value: {x: number; y: number} = object[objectKey];
    if (value.x == null || value.y == null) {
      console.error(
        '[DebugManager] createUnitPointInputBinding type of object[key] not match (Point2D{x, y}).',
        object,
        objectKey
      );
      return;
    }

    target = target || this.panel;

    target.addInput(object, objectKey, {
      label: label != null ? label : undefined,
      picker: isInline ? 'inline' : 'popup',
      expanded: isExpanded,
      x: {
        min: xParams?.min,
        max: xParams?.max,
        step: xParams?.step,
      },
      y: {
        min: yParams?.min,
        max: yParams?.max,
        step: yParams?.step,
        inverted: true,
      },
    } as Tweakpane.Point2dInputParams);
  }

  private createUnitMonitor<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi,
    object: O,
    objectKey: K,
    interval?: number,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onUpdate?: (value: string | number | boolean) => void
  ) {
    if (this.panel == null) return;

    target = target || this.panel;

    const value: string | number | boolean = object[objectKey];
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      console.error(
        '[DebugManager] createUnitMonitor type of object[key] not match (string | number | boolean).',
        object,
        objectKey
      );
      return;
    }

    const monitor = target.addMonitor(object, objectKey, {
      label: label != null ? label : undefined,
      interval: interval != null && interval > 0 ? interval : undefined,
      format: onFormat ? onFormat : undefined,
    });

    if (interval != null && interval <= 0) {
      const updateEvent: () => void = () => {
        try {
          if (!this.panel.expanded) return;

          monitor.refresh();
        } catch (err) {
          console.error('[DebugManager] createUnitMonitor error.', err);
          director.off(Director.EVENT_AFTER_UPDATE, updateEvent);
        }
      };
      director.on(Director.EVENT_AFTER_UPDATE, updateEvent);
    }

    if (onUpdate)
      monitor.on(
        'update',
        (evt: Tweakpane.TpUpdateEvent<string | number | boolean>) => {
          onUpdate(evt.value);
        }
      );
  }

  private createUnitGraphMonitor<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi,
    object: O,
    objectKey: K,
    min: number,
    max: number,
    interval?: number,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onUpdate?: (value: number) => void
  ) {
    if (this.panel == null) return;

    target = target || this.panel;

    const value: number = object[objectKey];
    if (typeof value !== 'number') {
      console.error(
        '[DebugManager] createUnitGraphMonitor type of object[key] not match (number).',
        object,
        objectKey
      );
      return;
    }

    const monitor = target.addMonitor(object, objectKey, {
      view: 'graph',
      label: label != null ? label : undefined,
      min: min,
      max: max,
      interval: interval != null && interval > 0 ? interval : undefined,
      format: onFormat ? onFormat : undefined,
    });

    if (interval != null && interval <= 0) {
      const updateEvent: () => void = () => {
        try {
          if (!this.panel.expanded) return;

          monitor.refresh();
        } catch (err) {
          console.error('[DebugManager] createUnitMonitor error.', err);
          director.off(Director.EVENT_AFTER_UPDATE, updateEvent);
        }
      };
      director.on(Director.EVENT_AFTER_UPDATE, updateEvent);
    }

    if (onUpdate)
      monitor.on('update', (evt: Tweakpane.TpUpdateEvent<number>) => {
        onUpdate(evt.value);
      });
  }

  private createUnitButton(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi,
    buttonName: string,
    onClick: () => void,
    hotKey?: string
  ): DebugPanelButton {
    if (this.panel == null) return;

    target = target || this.panel;

    const button = target.addButton({
      title: buttonName,
    });

    const debugPanelButton: DebugPanelButton = {
      name: buttonName,
      state: 0,
      stateName: '',
      emitClick: () => {
        button.controller_.valueController.emitter.emit('click', {
          sender: button.controller_.valueController,
        });
      },
    };

    button.on('click', () => {
      onClick();
    });

    if (hotKey != null) {
      button.label = hotKey;
      if (this.checkHotKey(hotKey)) this.hotKeyEvent[hotKey] = onClick;
    }

    return debugPanelButton;
  }

  private createUnitStateButton(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi,
    buttonName: string,
    stateList: Array<string>,
    onClick: (state: number) => void,
    hotKey?: string,
    defaultState = 0
  ): DebugPanelButton {
    if (this.panel == null) return;

    target = target || this.panel;

    let state: number = defaultState;

    const button = target.addButton({
      title: GetButtonName(),
    });

    const debugPanelButton: DebugPanelButton = {
      name: buttonName,
      state: state,
      stateName: '',
      emitClick: () => {
        button.controller_.valueController.emitter.emit('click', {
          sender: button.controller_.valueController,
        });
      },
    };

    const clickFn = () => {
      state = ++state % stateList.length;
      button.title = GetButtonName();
      debugPanelButton.state = state;
      debugPanelButton.stateName = stateList[state];
      onClick(state);
    };
    button.on('click', clickFn);

    if (hotKey != null) {
      button.label = hotKey;
      if (this.checkHotKey(hotKey)) this.hotKeyEvent[hotKey] = clickFn;
    }

    return debugPanelButton;

    function GetButtonName(): string {
      return `${buttonName} [${stateList[state]}]`;
    }
  }

  private createUnitList(
    target: Tweakpane.Pane | Tweakpane.FolderApi | Tweakpane.TabPageApi,
    itemList: Array<string | number>,
    onSelect: (item: string | number) => void,
    listName?: string,
    defaultItem?: string | number
  ) {
    if (this.panel == null) return;

    target = target || this.panel;

    const list = target.addBlade({
      view: 'list',
      label: listName != null ? listName : undefined,
      options: itemList.map((value: string | number) => {
        return {text: value, value: value};
      }),
      value: itemList.find(item => item === defaultItem) || itemList[0],
    } as Tweakpane.ListBladeParams<string | number>) as Tweakpane.ListApi<
      string | number
    >;
    list.on('change', (evt: Tweakpane.TpChangeEvent<string | number>) => {
      onSelect(evt.value);
    });
  }
  //#endregion Unit

  /**
   * 檢查快捷鍵
   * @param key KeyboardEvent.key
   */
  private checkHotKey(key: string): boolean {
    const isEmpty = !this.hotKeyEvent[key];
    if (!isEmpty) {
      console.warn(`[DebugManager] checkHotKey duplicate ${key}`);
    }
    return key != null && isEmpty;
  }

  /**
   * 按鍵事件
   * @param evt
   */
  private onKeyDown(evt: KeyboardEvent) {
    if (DebugManager._instance == null) return;

    const hotKeyEvent: Function = this.hotKeyEvent[evt.key];
    if (hotKeyEvent) hotKeyEvent();
  }

  /**
   * 創建除錯面板
   * @param target 創建對象
   */
  private createDebugPanel(
    target: Tweakpane.FolderApi | Tweakpane.TabPageApi
  ): DebugPanel {
    return {
      createFolder: this.createUnitFolder.bind(this, target),
      createTab: this.createUnitTab.bind(this, target),
      createSeparator: this.createUnitSeparator.bind(this, target),
      createInputBinding: this.createUnitInputBinding.bind(this, target),
      createSliderInputBinding: this.createUnitSliderInputBinding.bind(
        this,
        target
      ),
      createListInputBinding: this.createUnitListInputBinding.bind(
        this,
        target
      ),
      createPointInputBinding: this.createUnitPointInputBinding.bind(
        this,
        target
      ),
      createMonitor: this.createUnitMonitor.bind(this, target),
      createGraphMonitor: this.createUnitGraphMonitor.bind(this, target),
      createButton: this.createUnitButton.bind(this, target),
      createStateButton: this.createUnitStateButton.bind(this, target),
      createList: this.createUnitList.bind(this, target),
    };
  }

  /**
   * 創建根節點容器
   */
  private createRootContainer(targetDocument: Document): HTMLDivElement {
    //如果是用iframe方式開啟，掛在父級的body上，避免被平台iframe遮擋(遇到跨域會掛回本視窗)
    const targetParent =
      targetDocument === window.document
        ? game.canvas.parentNode
        : targetDocument.body;

    //容器標籤
    const rootContainer: HTMLDivElement = targetDocument.createElement('div');
    rootContainer.id = 'DebugPanel';
    rootContainer.style.position = 'absolute';
    rootContainer.style.left = '0px';
    rootContainer.style.top = '0px';
    rootContainer.style.maxHeight = '95%';
    rootContainer.style.overflowX = 'hidden';
    rootContainer.style.overflowY = 'auto';
    rootContainer.style.zIndex = '9999';

    targetParent.appendChild(rootContainer);
    //容器綁定在內部
    const containerBoundInside: Function = () => {
      setTimeout(() => {
        const parentWidth: number =
          game.canvas.parentElement.getBoundingClientRect().width;
        const containerX: number = parseFloat(rootContainer.style.left);
        const containerRightSide: number =
          containerX + rootContainer.getBoundingClientRect().width;
        if (containerRightSide < parentWidth) return;

        rootContainer.style.left =
          containerX - (containerRightSide - parentWidth) + 'px';
      }, 333);
    };
    //容器大小變化處理 防止面板超出範圍
    this.resizeObserver = new ResizeObserver(
      containerBoundInside as ResizeObserverCallback
    );
    this.resizeObserver.observe(rootContainer);
    //拖移處理
    //TODO: 手機轉向時需重新計算 沒空修
    let isTouch = false;
    let touchPosX = 0;
    let dragDeltaX = 0;
    let scrollTop = 0;
    const containerTouchStart = (evt: Event) => {
      if (
        this.panel == null ||
        (evt.target !== this.panel.controller_.view.titleElement &&
          evt.target !== this.panel.controller_.view.buttonElement)
      )
        return;

      isTouch = true;

      if (evt instanceof MouseEvent) {
        touchPosX = evt.clientX;
        /**
         * 若是觸摸事件（有的環境可用 `evt instanceof TouchEvent`；
         * 若編譯器/瀏覽器不支援，可用 `'touches' in evt`）
         * else if ('touches' in evt) {
         */
      } else if (evt instanceof TouchEvent) {
        touchPosX = evt.touches[0].clientX;
      }

      scrollTop = rootContainer.scrollTop;

      containerBoundInside();
    };
    const containerTouchMove: EventListener = (evt: Event) => {
      if (!isTouch) return;
      if (Math.abs(rootContainer.scrollTop - scrollTop) > 5) {
        isTouch = false;
        return;
      }

      if (evt instanceof MouseEvent) {
        dragDeltaX = evt.clientX - touchPosX;
        touchPosX = evt.clientX;
      } else if (evt instanceof TouchEvent) {
        dragDeltaX = evt.touches[0].clientX - touchPosX;
        touchPosX = evt.touches[0].clientX;
      }

      const nextContainerX: number =
        parseFloat(rootContainer.style.left) + dragDeltaX;
      if (
        nextContainerX < 0 ||
        nextContainerX + rootContainer.getBoundingClientRect().width >=
          game.canvas.parentElement.getBoundingClientRect().width
      )
        return;

      rootContainer.style.left = nextContainerX + 'px';
    };
    const containerTouchEnd: EventListener = (_evt: Event) => {
      isTouch = false;
    };
    rootContainer.addEventListener('mousedown', containerTouchStart);
    rootContainer.addEventListener('touchstart', containerTouchStart);
    rootContainer.addEventListener('mousemove', containerTouchMove);
    rootContainer.addEventListener('touchmove', containerTouchMove);
    rootContainer.addEventListener('mouseleave', containerTouchEnd);
    rootContainer.addEventListener('touchcancel', containerTouchEnd);
    rootContainer.addEventListener('mouseup', containerTouchEnd);
    rootContainer.addEventListener('touchend', containerTouchEnd);

    return rootContainer;
  }

  /**
   * 創建顯示狀態面板
   */
  private createDisplayStatsPanel() {
    if (this.panel == null) return;

    //建立彈出按鈕，因為需要用到hide功能，所以不用包裝好的CreateButton
    const popBtn: Tweakpane.ButtonApi = this.panel.addButton({
      title: '在新視窗開DebugPanel',
    });

    //按下彈出按鈕時
    popBtn.on('click', () => {
      //建立新視窗
      let newWindow: Window = window.open(
        '',
        'DebugPanel',
        'width=500,height=900'
      );
      //設定新視窗標題與背景顏色
      newWindow.document.title = 'DebugPanel';
      newWindow.document.body.style.background = '#262626';

      //找到DebugPanel的節點，並將DebugPanel的節點整個移動到新視窗
      for (
        let i = 0;
        i < window.document.getElementsByTagName('div').length;
        i++
      ) {
        const element: HTMLDivElement =
          window.document.getElementsByTagName('div')[i];

        if (element.id === 'DebugPanel') {
          //紀錄原本樣式
          const tmpStyle: string = element.style.cssText;
          //紀錄原本位置
          const tmpPosition: string = element.style.left;
          //修改樣式，讓DebugPanel在新視窗完全伸展
          element.style.position = '';
          element.style.maxHeight = '';
          //移動到新視窗的位置要靠左
          element.style.left = '0px';
          //建立新視窗的Tweakpane
          new Tweakpane.Pane({
            container: newWindow.document.body,
            document: newWindow.document,
          });
          //隱藏彈出按鈕
          popBtn.hidden = true;
          //加進body，才會顯示出來
          //Tweakpane.Pane新建時會自動建child，所以要把它自動建的那個取代掉
          newWindow.document.body.replaceChildren(element);
          //新開出來的視窗要unload(關閉)時，把DebugPanel放回遊戲去
          newWindow.window.addEventListener('beforeunload', () => {
            if (newWindow) {
              //把DebugPanel的樣式改回原本的
              element.style.cssText = tmpStyle;
              //移動回原本位置
              element.style.left = tmpPosition ? tmpPosition : '0px';
              //確保 z-index 足夠高，避免被 canvas 遮擋
              element.style.zIndex = '9999';
              //把DebugPanel放回去（插入到 canvas 之後，確保顯示在上層）
              game.canvas.parentNode.insertBefore(
                element,
                game.canvas.nextSibling
              );
              //顯示彈出按鈕
              popBtn.hidden = false;
              //把新開出來的視窗設為null
              newWindow = null;
            }
          });

          //遊戲視窗要unload(關閉、重載)時，把新開出來的視窗關掉
          this.bindBeforeUnload = () => {
            if (newWindow) {
              newWindow.close();
            }
          };
          window.addEventListener('beforeunload', this.bindBeforeUnload);

          break;
        }
      }
    });

    const cocosDisplayStatsFolder: DebugPanelFolder = this.createFolder(
      'DisplayStats',
      profiler.isShowingStats(),
      (isExpanded: boolean) => {
        if (isExpanded) profiler.showStats();
        else profiler.hideStats();
      }
    );
    cocosDisplayStatsFolder.createGraphMonitor(
      this.ccProfiler,
      'DrawCalls',
      0,
      200,
      0,
      'DrawCall'
    );
    cocosDisplayStatsFolder.createGraphMonitor(
      this.ccProfiler,
      'FPS',
      0,
      100,
      0,
      'FPS'
    );
    cocosDisplayStatsFolder.createGraphMonitor(
      this.ccProfiler,
      'FrameTime',
      0,
      30,
      0,
      'FrameTime(ms)'
    );
    cocosDisplayStatsFolder.createGraphMonitor(
      this.ccProfiler,
      'GameLogic',
      0,
      30,
      0,
      'GameLogic(ms)'
    );
    cocosDisplayStatsFolder.createGraphMonitor(
      this.ccProfiler,
      'Renderer',
      0,
      30,
      0,
      'Renderer(ms)'
    );
  }

  /**
   * 徹底隱藏原生 Profiler 節點
   */
  private hideNativeProfilerNode() {
    if (
      !this.cachedNativeProfilerNode ||
      !this.cachedNativeProfilerNode.isValid
    ) {
      this.cachedNativeProfilerNode = find('PROFILER_NODE');
    }

    const profilerNode = this.cachedNativeProfilerNode;
    if (profilerNode && profilerNode.isValid) {
      // 設置為非激活狀態
      profilerNode.active = false;
      // 設置透明度為 0
      const uiOpacity = profilerNode.getComponent(UIOpacity);
      if (uiOpacity) {
        uiOpacity.opacity = 0;
      } else {
        const opacityComp = profilerNode.addComponent(UIOpacity);
        opacityComp.opacity = 0;
      }
      // 設置縮放為 0（完全隱藏）
      profilerNode.setScale(0, 0, 0);
      // 移動到屏幕外
      profilerNode.setPosition(99999, 99999, 0);
      // 遞歸隱藏所有子節點及其組件
      const hideNodeRecursively = (node: Node) => {
        if (!node || !node.isValid) return;

        // 隱藏節點本身
        node.active = false;

        // 設置透明度為 0
        let uiOpacity = node.getComponent(UIOpacity);
        if (!uiOpacity) {
          uiOpacity = node.addComponent(UIOpacity);
        }
        uiOpacity.opacity = 0;

        // 設置縮放為 0
        node.setScale(0, 0, 0);

        // 移動到屏幕外
        node.setPosition(99999, 99999, 0);

        // 禁用所有 Label 組件
        const label = node.getComponent(Label);
        if (label) {
          label.enabled = false;
        }

        // 遞歸處理所有子節點
        node.children.forEach(child => {
          hideNodeRecursively(child);
        });
      };

      // 對所有子節點遞歸隱藏
      profilerNode.children.forEach(child => {
        hideNodeRecursively(child);
      });
    }
  }

  /**
   * 優化Cocos Profiler
   */
  private optimizeProfiler() {
    // 攔截 profiler.showStats、hideStats 和 isShowingStats，確保原生介面始終隱藏且數據持續更新
    if (!this.originalShowStats) {
      this.originalShowStats = profiler.showStats.bind(profiler);
      this.originalHideStats = profiler.hideStats.bind(profiler);
      this.originalIsShowingStats = profiler.isShowingStats.bind(profiler);

      // 攔截 showStats：調用原始方法但隱藏原生節點，並顯示自定義節點
      profiler.showStats = () => {
        this.profilerShowingState = true;

        // 如果原生節點存在但沒有父節點（之前被移除了），需要重新添加
        const existingProfilerNode = find('PROFILER_NODE');
        if (
          existingProfilerNode &&
          existingProfilerNode.isValid &&
          !existingProfilerNode.parent
        ) {
          const canvas = find('Canvas');
          if (canvas && canvas.isValid) {
            canvas.addChild(existingProfilerNode);
          } else {
            const scene = director.getScene();
            if (scene && scene.isValid) {
              scene.addChild(existingProfilerNode);
            }
          }
        }

        // 立即更新自定義節點的狀態（在調用原始方法之前）
        if (this.customProfilerNode && this.customProfilerNode.isValid) {
          this.customProfilerNode.active = true;
        }

        this.originalShowStats();

        // 創建停止 shader 渲染的處理函數（如果還沒有創建）
        if (!this.stopShaderRenderHandler) {
          this.stopShaderRenderHandler = () => {
            // 在渲染之前停止 shader 渲染
            if (this.profilerShowingState) {
              // 調用原始的 hideStats() 來停止 shader 渲染
              this.originalHideStats();
              // 立即重新調用 showStats() 來保持數據更新
              this.originalShowStats();
            }
            // 隱藏原生節點
            this.hideNativeProfilerNode();
          };
        }

        // 在渲染之前停止 shader 渲染（每幀都會執行）
        // 先 off 再 on 確保不會重複註冊
        director.off(
          Director.EVENT_BEFORE_DRAW,
          this.stopShaderRenderHandler,
          this
        );
        director.on(
          Director.EVENT_BEFORE_DRAW,
          this.stopShaderRenderHandler,
          this
        );
        // 持續監聽並隱藏原生節點（防止被重新激活）
        director.off(
          Director.EVENT_AFTER_UPDATE,
          this.hideNativeProfilerNode,
          this
        );
        director.on(
          Director.EVENT_AFTER_UPDATE,
          this.hideNativeProfilerNode,
          this
        );
      };

      // 攔截 hideStats：隱藏原生節點和自定義節點，但不取消事件監聽
      profiler.hideStats = () => {
        this.profilerShowingState = false;

        // 調用原始 hideStats() 來真正隱藏 shader 渲染的內容
        this.originalHideStats();

        // 隱藏自定義節點
        if (this.customProfilerNode && this.customProfilerNode.isValid) {
          this.customProfilerNode.active = false;
        }
        // 停止持續監聽（節省性能）
        director.off(
          Director.EVENT_AFTER_UPDATE,
          this.hideNativeProfilerNode,
          this
        );
        // 停止 shader 渲染監聽
        if (this.stopShaderRenderHandler) {
          director.off(
            Director.EVENT_BEFORE_DRAW,
            this.stopShaderRenderHandler,
            this
          );
        }
      };

      // 攔截 isShowingStats：返回我們追蹤的狀態，而不是實際的 profiler 狀態
      // 這樣 ShowFPS 按鈕才能正確判斷當前狀態
      profiler.isShowingStats = () => {
        return this.profilerShowingState;
      };
    }

    // 初始狀態同步：預設為隱藏
    this.profilerShowingState = false;

    // 確保底層也是隱藏狀態
    this.originalHideStats();

    //優化內容
    const optimizeContent: (
      arg1?: any,
      arg2?: any,
      arg3?: any,
      arg4?: any,
      arg5?: any
    ) => void = () => {
      // 如果節點已存在且有效，且已經在腳本節點下，則不重複創建
      if (
        this.customProfilerNode &&
        this.customProfilerNode.isValid &&
        this.customProfilerNode.parent === this.node
      ) {
        return;
      }

      // 如果節點存在但無效，清除引用以便重新創建
      if (this.customProfilerNode && !this.customProfilerNode.isValid) {
        this.customProfilerNode = null;
      }

      const ccProfilerNode = new Node('PROFILER_NODE_CUSTOM');
      // 保存為實例變量，避免被垃圾回收
      this.customProfilerNode = ccProfilerNode;

      const profilerTransform = ccProfilerNode.addComponent(UITransform);
      profilerTransform.setContentSize(400, 300);
      ccProfilerNode.layer = Layers.Enum.UI_2D;
      // 設置位置在左上角（使用設計分辨率）
      // 注意：UI 節點使用本地坐標系，錨點在中心，所以需要調整位置計算
      const designSize = view.getDesignResolutionSize();
      // 對於 UI 節點，位置是相對於父節點的，Canvas 的錨點通常在中心
      // 所以左上角應該是：x = -width/2 + offset, y = height/2 - offset
      ccProfilerNode.setPosition(
        -designSize.width * (0.5 - 0.1),
        designSize.height * (0.5 - 0.73),
        0
      );

      // 根據追蹤的狀態設置節點的激活狀態
      ccProfilerNode.active = this.profilerShowingState;

      // 將節點添加到腳本所在的節點下
      if (this.node && this.node.isValid) {
        this.node.addChild(ccProfilerNode);
      } else {
        return;
      }

      // 監聽場景啟動事件，確保在場景切換後節點仍然存在
      // 如果已經有舊的監聽器，先移除它
      if (this.moveProfilerNodeToCanvas) {
        director.off(
          Director.EVENT_AFTER_SCENE_LAUNCH,
          this.moveProfilerNodeToCanvas,
          this
        );
      }

      // 監聽場景啟動事件，檢查節點是否仍然存在，如果被銷毀則重新創建
      this.moveProfilerNodeToCanvas = () => {
        // 檢查節點是否仍然存在且有效
        if (this.customProfilerNode && this.customProfilerNode.isValid) {
          // 節點仍然存在，檢查是否在腳本節點下
          if (
            this.node &&
            this.node.isValid &&
            this.customProfilerNode.parent !== this.node
          ) {
            // 如果節點不在腳本節點下，重新添加
            if (this.customProfilerNode.parent) {
              this.customProfilerNode.removeFromParent();
            }
            this.node.addChild(this.customProfilerNode);
            this.customProfilerNode.active = this.profilerShowingState;
          }
        } else {
          // 節點已被銷毀，需要重新創建
          // 清除引用，讓 optimizeProfiler 重新創建
          this.customProfilerNode = null;
          // 延遲一幀後重新創建
          this.scheduleOnce(() => {
            if (!this.customProfilerNode || !this.customProfilerNode.isValid) {
              this.optimizeProfiler();
            }
          }, 0);
        }
      };

      // 監聽場景啟動事件，確保在場景切換後節點仍然存在
      director.on(
        Director.EVENT_AFTER_SCENE_LAUNCH,
        this.moveProfilerNodeToCanvas,
        this
      );

      // 創建面板節點的輔助函數
      const createPanelNode = (
        name: string,
        position: number,
        align: number,
        getString: (key: string) => string
      ): {node: Node; label: Label; originalString: string} => {
        const panelNode = new Node(name);
        panelNode.layer = Layers.Enum.UI_2D;
        const transform = panelNode.addComponent(UITransform);
        transform.setContentSize(200, 300);
        panelNode.setPosition(position, 0, 0);
        panelNode.active = true;

        const label = panelNode.addComponent(Label);
        label.fontSize = 12;
        label.lineHeight = 12;
        label.color = color(255, 255, 255, 255);
        label.horizontalAlign = align;
        label.verticalAlign = Label.VerticalAlign.TOP;
        label.enableOutline = true;
        label.outlineColor = color(0, 0, 0, 255);
        label.outlineWidth = 2;
        label.string = '';
        if (profiler.stats) {
          Object.keys(profiler.stats).forEach((key: string) => {
            label.string += getString(key) + '\n';
          });
        }

        ccProfilerNode.addChild(panelNode);
        return {node: panelNode, label, originalString: label.string};
      };

      // 創建左側面板（顯示描述）
      const leftPanel = createPanelNode(
        'LEFT-PANEL',
        -50,
        Label.HorizontalAlign.LEFT,
        (key: string) => profiler.stats[key].desc
      );
      const leftPanelLabel = leftPanel.label;

      // 創建右側面板（顯示數值）
      const rightPanel = createPanelNode(
        'RIGHT-PANEL',
        50,
        Label.HorizontalAlign.RIGHT,
        (key: string) => profiler.stats[key].counter.value.toString()
      );
      const rightPanelLabel = rightPanel.label;

      const memoryInfoTitle = 'MemLimit (MB)\nTotalMem (MB)\nUsedMem (MB)\n';
      const memoryUnit: number = 1 / 1024 ** 2;

      // 紀錄左側面板是否已初始化描述內容
      let isLeftPanelInitialized = false;
      let currentOriginalLeftString = leftPanel.originalString;

      if (!ccProfilerNode) return;
      //資訊更新
      this.profilerUpdateHandler = () => {
        try {
          // 檢查自定義節點是否仍然存在
          if (!this.customProfilerNode || !this.customProfilerNode.isValid) {
            if (this.profilerUpdateHandler) {
              director.off(
                Director.EVENT_AFTER_UPDATE,
                this.profilerUpdateHandler,
                this
              );
              this.profilerUpdateHandler = null;
            }
            return;
          }

          // 只有在追蹤狀態為開啟時才進行處理
          if (this.profilerShowingState) {
            // 確保底層統計開啟以保持監控圖表數據更新
            if (!this.originalIsShowingStats()) {
              this.originalShowStats();
            }
            // 確保原生節點隱藏
            this.hideNativeProfilerNode();
          }

          // 根據追蹤的 UI 狀態控制自定義節點的顯示
          if (this.customProfilerNode && this.customProfilerNode.isValid) {
            this.customProfilerNode.active = this.profilerShowingState;
          }

          // 如果描述內容尚未初始化，且 profiler.stats 已經可用，則進行初始化
          if (!isLeftPanelInitialized && profiler.stats) {
            currentOriginalLeftString = '';
            Object.keys(profiler.stats).forEach((key: string) => {
              currentOriginalLeftString += profiler.stats[key].desc + '\n';
            });
            isLeftPanelInitialized = true;
          }

          // 一般資訊
          const ccProfiler = profiler.stats;
          if (ccProfiler && this.ccProfiler) {
            this.ccProfiler.DrawCalls = ccProfiler.draws.counter.value;
            this.ccProfiler.FPS = ccProfiler.fps.counter.value;
            this.ccProfiler.FrameTime = ccProfiler.frame.counter.value;
            this.ccProfiler.GameLogic = ccProfiler.logic.counter.value;
            this.ccProfiler.Renderer = ccProfiler.render.counter.value;
          }
          //記憶體資訊
          const memoryInfo: any = window?.performance?.['memory'];
          if (!memoryInfo || !this.node.isValid) {
            if (this.profilerUpdateHandler) {
              director.off(
                Director.EVENT_AFTER_UPDATE,
                this.profilerUpdateHandler,
                this
              );
              this.profilerUpdateHandler = null;
            }
            return;
          }
          // 檢查 leftPanelLabel 及其 node 是否存在且有效
          if (
            leftPanelLabel &&
            leftPanelLabel.node &&
            leftPanelLabel.node.isValid &&
            leftPanelLabel.node.activeInHierarchy
          ) {
            leftPanelLabel.string = currentOriginalLeftString + memoryInfoTitle;
          }
          // 檢查 rightPanelLabel 及其 node 是否存在且有效（修正：使用 rightPanelLabel.node 而非 leftPanelLabel.node）
          if (
            rightPanelLabel &&
            rightPanelLabel.node &&
            rightPanelLabel.node.isValid &&
            rightPanelLabel.node.activeInHierarchy
          ) {
            rightPanelLabel.string = '';
            if (profiler.stats) {
              Object.keys(profiler.stats).forEach((key: string) => {
                rightPanelLabel.string +=
                  profiler.stats[key].counter.value.toFixed(2) + '\n';
              });
            }
            rightPanelLabel.string += `${(Number(memoryInfo['jsHeapSizeLimit']) * memoryUnit).toFixed(4)}\n`;
            rightPanelLabel.string += `${(Number(memoryInfo['totalJSHeapSize']) * memoryUnit).toFixed(4)}\n`;
            rightPanelLabel.string += `${(Number(memoryInfo['usedJSHeapSize']) * memoryUnit).toFixed(4)}\n`;
          }
        } catch (err) {
          console.error('[DebugManager] memoryInfoUpdate error.', err);

          if (this.profilerUpdateHandler) {
            director.off(
              Director.EVENT_AFTER_UPDATE,
              this.profilerUpdateHandler,
              this
            );
            this.profilerUpdateHandler = null;
          }
        }
      };
      director.on(
        Director.EVENT_AFTER_UPDATE,
        this.profilerUpdateHandler,
        this
      );

      director.once(
        Director.EVENT_AFTER_UPDATE,
        () => {
          // 確保原生 profiler 節點被隱藏
          this.hideNativeProfilerNode();

          // 直接使用追蹤的狀態（因為我們已經攔截了所有調用）
          // 確保我們的自定義節點仍然存在且激活（根據追蹤的狀態）
          if (this.customProfilerNode && this.customProfilerNode.isValid) {
            this.customProfilerNode.active = this.profilerShowingState;
          }
        },
        this
      );
    };
    director.once(Director.EVENT_AFTER_UPDATE, optimizeContent, this);
  }
}

/** 除錯面板 (資料夾) */
export interface DebugPanelFolder extends DebugPanel {
  isExpanded: boolean;
  clear: Function;
}

/** 除錯面板 */
export interface DebugPanel {
  /**
   * 創建資料夾
   * @param name 名稱
   * @param isExpanded 是否展開, 預設為true
   * @param onFold 折疊事件
   */
  createFolder(
    name: string,
    isExpanded?: boolean,
    onFold?: (isExpanded: boolean) => void
  ): DebugPanelFolder;
  /**
   * 創建分頁
   * @param nameList 名稱列表
   * @param onSelect 選擇事件
   */
  createTab(
    nameList: Array<string>,
    onSelect?: (pageIndex: number) => void
  ): Array<DebugPanel>;
  /**
   * 創建分隔
   */
  createSeparator();
  /**
   * 創建輸入綁定 (string | number | boolean)
   * @param object 綁定物件
   * @param objectKey 綁定鍵值
   * @param label 標籤名稱
   * @param onFormat 格式化事件
   * @param onChange 變更事件
   */
  createInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onChange?: (value: string | number | boolean) => void
  );
  /**
   * 創建滑塊輸入綁定 (number)
   * @param object 綁定物件
   * @param objectKey 綁定鍵值
   * @param min 最小值
   * @param max 最大值
   * @param step 步進值
   * @param label 標籤名稱
   * @param onFormat 格式化事件
   * @param onChange 變更事件
   */
  createSliderInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    min: number,
    max: number,
    step?: number,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onChange?: (value: number) => void
  );
  /**
   * 創建列表輸入綁定 (string | number)
   * @param object 綁定物件
   * @param objectKey 綁定鍵值
   * @param list 列表
   * @param label 標籤名稱
   * @param onChange 變更事件
   */
  createListInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    list: {[itemName: string]: string | number},
    label?: string,
    onChange?: (value: string | number) => void
  );
  /**
   * 創建座標輸入綁定 (Point2D)
   * @param object 綁定物件
   * @param objectKey 綁定鍵值
   * @param label 標籤名稱
   * @param xParams x座標參數設定
   * @param yParams y座標參數設定
   * @param isInline 是否將圖像化座標面板與輸入欄合併 (預設為彈出面板)
   * @param isExpanded 是否展開圖像化座標面板
   */
  createPointInputBinding<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    label?: string,
    xParams?: {max?: number; min?: number; step?: number},
    yParams?: {max?: number; min?: number; step?: number},
    isInline?: boolean,
    isExpanded?: boolean
  );
  /**
   * 創建變數監控 (string | number | boolean)
   * @param object 綁定物件
   * @param objectKey 綁定鍵值
   * @param interval 間隔時間(ms)
   * 未設定則為預設值200ms 大於0則以設定時間更新 否則同遊戲更新
   * @param label 標籤名稱
   * @param onFormat 格式化事件
   * @param onUpdate 更新事件
   */
  createMonitor<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    interval?: number,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onUpdate?: (value: string | number | boolean) => void
  );
  /**
   * 創建圖像數值監控 (number)
   * @param object 綁定物件
   * @param objectKey 綁定鍵值
   * @param min 最小值
   * @param max 最大值
   * @param interval 間隔時間(ms)
   * 未設定則為預設值200ms 大於0則以設定時間更新 否則同遊戲更新
   * @param label 標籤名稱
   * @param onFormat 格式化事件
   * @param onUpdate 更新事件
   */
  createGraphMonitor<
    O extends Record<string, any>,
    K extends Extract<keyof O, string>,
  >(
    object: O,
    objectKey: K,
    min: number,
    max: number,
    interval?: number,
    label?: string,
    onFormat?: (value: string | number) => string | number,
    onUpdate?: (value: number) => void
  );
  /**
   * 創建按鈕
   * @param buttonName 按鈕名稱
   * @param onClick 點擊事件
   * @param hotKey 快捷鍵 (KeyboardEvent.key)
   */
  createButton(
    buttonName: string,
    onClick: () => void,
    hotKey?: string
  ): DebugPanelButton;
  /**
   * 創建狀態按鈕
   * @param buttonName 按鈕名稱
   * @param stateList 狀態列表
   * @param onClick 點擊事件
   * @param hotKey 快捷鍵 (KeyboardEvent.key)
   * @param defaultState 預設的狀態
   */
  createStateButton(
    buttonName: string,
    stateList: Array<string>,
    onClick: (state: number) => void,
    hotKey?: string,
    defaultState?: number
  ): DebugPanelButton;
  /**
   * 創建下拉選單
   * @param itemList 項目列表
   * @param onSelect 項目選擇事件
   * @param listName 列表名稱
   * @param defaultItem 預設選擇的項目
   */
  createList(
    itemList: Array<string>,
    onSelect: (item: string | number) => void,
    listName?: string,
    defaultItem?: string | number
  );
}

/** 除錯面板按鈕 */
export interface DebugPanelButton {
  name: string;
  state: number;
  stateName: string;
  emitClick: Function;
}
