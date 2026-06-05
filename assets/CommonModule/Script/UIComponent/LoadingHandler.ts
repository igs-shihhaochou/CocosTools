import {
  _decorator,
  director,
  Director,
  Component,
  tween,
  easing,
  lerp,
  Node,
  ProgressBar,
  Label,
  Tween,
  Button,
  AudioClip,
  color,
  AudioSource,
  UIOpacity,
} from 'cc';
import Functions from '../Utility/Functions';
import {
  getWidth,
  getHeight,
  setScale,
  getUIOpacity,
  setOpacity,
  setColor,
} from '../Utility/NodeProperty';
import {tweenNodeEx} from '../Utility/TweenUtil';
import {Delegate} from '../ExtraType';
import {PlatformData} from '../Define/PlatformData';
import GAHandler from '../Log/GA/GAHandler';
import {GAEventGameFlow} from '../Platform/PlatformGDK';
import BQLogger from '../Log/BQLog/BQLogger';
/**
 * Loading page handler
 */
/** Load task */
import EventManager, {EventType} from '../Manager/EventManager';
import PlatformEventNotifier from 'db://assets/CommonModule/Script/Utility/PlatformEventNotifier';

const {ccclass, property, menu} = _decorator;
const loadTip = window.LoadTip;

/** 載入任務 */
export interface LoadTask {
  /** 進度 */
  progress: number;
  /** 權重 */
  weight: number;
  /** 預計項目總數 */
  totalItem: number;
  /** 是否完成 */
  complete: boolean;
}

/** 載入任務列表 */
export interface LoadTaskList {
  /** 任務名稱 */
  [taskName: string]: LoadTask;
}

/** 載入任務資訊 */
export interface LoadTaskInfo {
  /** 名稱 */
  Name: string;
  /** 權重 */
  Weight: number;
}

/** 載入任務資訊列表 */
export interface LoadTaskInfoList {
  /** 任務名稱 */
  [taskName: string]: LoadTaskInfo;
}

/** 載入頁事件名稱列表 */
interface LoadingHandlerEvent {
  readonly ON_LOADING_VIEW_CLOSE: string;
}

/** 載入頁事件名稱列表 */
export const LoadingHandlerEvent: EventType<LoadingHandlerEvent> = {
  ON_LOADING_VIEW_CLOSE: 'LoadingHandler_OnLoadingViewClose',
};

/**
 * 載入頁處理
 */
@ccclass('LoadingHandler')
@menu('CommonModule/Script/UIComponent/LoadingHandler')
export default class LoadingHandler extends Component {
  /** 取得 Singleton 物件實體 */
  public static get instance(): LoadingHandler {
    return LoadingHandler._instance;
  }
  /** Instance 實體 */
  private static _instance: LoadingHandler = null;

  /** 載入頁節點 */
  @property(Node)
  protected loadingPageNode: Node = null;

  /** 進度條根節點 (不一定為動態進度條自身) */
  @property(Node)
  protected progressBarNode: Node = null;
  /** 進度條 */
  @property(ProgressBar)
  protected progressBar: ProgressBar = null;
  /** 進度條數值 */
  @property(Label)
  protected progressText: Label = null;

  /** 載入階段文字 */
  @property(Label)
  protected loadingLevelText: Label = null;

  /** 載入提示文字 */
  @property(Label)
  protected loadingTip: Label = null;

  @property(Node)
  protected poweredByNode: Node = null;

  @property(Button)
  protected closeBtn: Button = null;

  @property(Node)
  protected progressBarRoot: Node = null;

  @property(AudioClip)
  private mutedAudio: AudioClip = null;

  public onCloseBtnClicked: Delegate = new Delegate();

  public onAfterLoadingClosed: Delegate = new Delegate();

  /** 載入完成事件 */
  protected onComplete: Function = null;
  /** 載入任務列表 */
  protected loadTaskList: LoadTaskList = null;

  /** 更新進度補間 */
  protected updateProgressTween: Tween<Node> = null;

  /** 起始載入總進度 (補間使用) */
  protected beginTotalProgress = 0;
  /** 最後載入總進度 */
  protected lastTotalProgress = 0;
  /** 載入總進度 */
  protected totalProgress = 0;

  /** 是否顯示載入頁畫面 */
  protected isShowView = false;
  /** 是否顯示進度條 */
  protected isShowProgress = false;

  /** 是否顯示過關閉按鈕 */
  protected hasShownCloseBtn = false;
  /** 需等待玩家點擊才能真的關閉loading，用來阻擋連續ShowProgressView(false) */
  protected isClickClose = false;

  /** 載入合併 */
  private loadingMerge = 0;
  /** 載入支線數量 */
  private loadingLineCount = 0;
  /** 第一次跑條到100% */
  private firstLoadingFinished = false;

  protected get showOkBtnWhenLoadingEnd(): boolean {
    return PlatformData.gameSetting?.ShowOkBtnWhenLoadingEnd === true;
  }

  protected override onLoad() {
    if (LoadingHandler._instance) {
      this.node.destroy();
      return;
    }
    LoadingHandler._instance = this;

    this.init();
    if (this.closeBtn) {
      this.closeBtn.interactable = false;
      setOpacity(this.closeBtn.node, 0);
    }
  }

  protected override onDestroy() {
    this.release();
  }

  /**
   * 初始化
   */
  protected init() {
    PlatformEventNotifier.loadingGame();

    //初始化載入任務列表
    this.loadTaskList = {};

    this.loadingMerge = 1;
    if (PlatformData.gameSetting) {
      this.loadingMerge = PlatformData.gameSetting.InitLoadingMerge ?? 1;
    }
    this.loadingLineCount = 1;

    //預設隱藏
    setOpacity(this.node, 0);
    //載入畫面淡入
    this.showLoadingView();

    if (this.progressBarNode) {
      //進度條預設隱藏
      if (this.progressBarNode) setOpacity(this.progressBarNode, 0);
      this.showProgress(false);
      //進度條更新 (借用scale)
      this.updateProgressTween = tween(this.progressBarNode).to(
        5,
        {scale: this.progressBarNode.scale},
        {
          progress: (
            start: number,
            end: number,
            current: number,
            t: number
          ): number => {
            if (this.beginTotalProgress > this.totalProgress) {
              console.warn(
                '[LoadingHandler] updateProgressTween beginTotalProgress > totalProgress',
                this.beginTotalProgress,
                this.totalProgress
              );
            }
            this.setProgressBarAndText(
              this.beginTotalProgress +
                (this.totalProgress - this.beginTotalProgress) * t
            );
            return lerp(start, end, t);
          },
        }
      );
    }

    //初始化進度條
    this.setProgressBarAndText(0);

    //初始化載入階段文字
    this.setLoadingLevelText('');

    //載入提示預設隱藏
    if (this.loadingTip) setOpacity(this.loadingTip.node, 0);

    //初始化Powered by
    const logoName: string = Functions.getURLParameterByName('ShowLogo');
    if (typeof GlobalConfig !== 'undefined' && logoName !== '') {
      if (!this.poweredByNode)
        this.poweredByNode = this.node.getChildByName('Logo');
      if (this.poweredByNode && GlobalConfig.WhiteLogoSetting)
        this.poweredByNode.active =
          !GlobalConfig.WhiteLogoSetting.IsClosePoweredBy(logoName);
    }

    EventManager.instance.registerEvents(LoadingHandlerEvent);
  }

  /**
   * 釋放LoadingHandler資源
   */
  protected release() {
    EventManager.instance.unregisterEvents(LoadingHandlerEvent);

    this.onComplete = null;
    if (this.loadTaskList) {
      for (const idx in this.loadTaskList) {
        delete this.loadTaskList[idx];
      }
    }
    this.loadTaskList = null;

    this.updateProgressTween = null;

    LoadingHandler._instance = null;
  }

  /**
   * 銷毀LoadingHandler實體
   */
  public destroySelf() {
    if (!LoadingHandler._instance) return;

    this.node.destroy();
  }

  /**
   * 重置
   * (進度、階段文字、完成事件、任務列表)
   * (若初始化時有合併載入條則將重置動作計入次數 用於進度條比例計算)
   */
  public reset() {
    this.setLoadingLevelText('');

    this.onComplete = null;

    //合併載入條則將重置動作計入次數 用於進度條比例計算
    if (this.loadingMerge > 1) {
      if (this.loadingLineCount < this.loadingMerge) {
        this.loadingLineCount++;
        return;
      }
      this.loadingLineCount = this.loadingMerge = 1;
    }

    this.totalProgress = this.lastTotalProgress = this.beginTotalProgress = 0;

    this.setProgressBarAndText(0);

    if (this.loadTaskList) {
      for (const idx in this.loadTaskList) {
        delete this.loadTaskList[idx];
      }
    }
  }

  /**
   * 顯示載入畫面 (載入頁、進度條)
   * @param isShow
   */
  public showLoadingView(isShow = true) {
    if (
      !isShow &&
      this.closeBtn &&
      this.showOkBtnWhenLoadingEnd &&
      !this.isClickClose
    ) {
      return;
    }

    if (isShow === this.isShowView) return;

    this.node.active = true;
    if (this.loadingPageNode) this.loadingPageNode.active = true;
    if (this.progressBarNode) this.progressBarNode.active = true;
    //停止 避免重複觸發
    Tween.stopAllByTarget(this.node);
    //漸變
    tween(getUIOpacity(this.node))
      .to(0.15, {opacity: 255 * Number(isShow)})
      .call(() => {
        this.node.active = isShow;
      })
      .start();
    //開關
    this.isShowView = isShow;

    if (this.isShowView === false) {
      EventManager.instance.dispatchEvent(
        LoadingHandlerEvent.ON_LOADING_VIEW_CLOSE
      );
      if (this.onAfterLoadingClosed.length) {
        this.onAfterLoadingClosed.notify();
      }
    }
  }

  /**
   * 顯示進度畫面 (僅進度條)
   * @param isShow
   */
  public showProgressView(isShow = true) {
    if (
      !isShow &&
      this.closeBtn &&
      this.showOkBtnWhenLoadingEnd &&
      !this.isClickClose
    ) {
      return;
    } else {
      if (this.onAfterLoadingClosed.length) {
        this.onAfterLoadingClosed.notify();
      }
    }

    if (isShow === this.isShowView) return;

    this.showLoadingView(isShow);

    if (this.loadingPageNode) this.loadingPageNode.active = false;

    this.showProgress(true);
  }

  /**
   * 顯示進度條
   * @param isShow
   */
  public showProgress(isShow = true) {
    if (isShow === this.isShowProgress || !this.progressBarNode) return;

    this.progressBarNode.active = true;

    //停止 避免重複觸發
    Tween.stopAllByTarget(this.progressBarNode);
    //漸變
    tween(getUIOpacity(this.progressBarNode))
      .to(0.15, {opacity: 255 * Number(isShow)})
      .call(() => {
        this.progressBarNode.active = isShow;
        //隱藏時停止
        if (!isShow) Tween.stopAllByTarget(this.progressBarNode);
      })
      .start();
    //重啟更新
    if (isShow) {
      this.beginTotalProgress = this.lastTotalProgress;
      this.setProgressBarAndText(this.beginTotalProgress);
      if (this.updateProgressTween) this.updateProgressTween.start();
    }
    //開關
    this.isShowProgress = isShow;
  }

  /**
   * 設定載入階段文字
   * @param text
   */
  public setLoadingLevelText(text: string) {
    if (!this.loadingLevelText) return;

    this.loadingLevelText.string = text;
  }

  /**
   * 設置載入提示文字
   * @param lang
   */
  public setLoadingTip(lang: string) {
    if (!this.loadingTip) return;
    if (!loadTip || !loadTip[lang] || loadTip[lang].length === 0) return;

    let tipIndex: number = Math.floor(LoadTip[lang].length * Math.random());
    this.loadingTip.string = LoadTip[lang][tipIndex];

    tween(this.loadingTip.node)
      .sequence(
        tween(getUIOpacity(this.loadingTip.node)).to(
          0.5,
          {opacity: 255},
          {easing: easing.fade}
        ),
        tween(this.loadingTip.node).delay(1.5),
        tween(getUIOpacity(this.loadingTip.node)).to(
          0.5,
          {opacity: 0},
          {easing: easing.fade}
        ),
        tween(this.loadingTip.node).call(() => {
          tipIndex++;
          if (tipIndex >= loadTip[lang].length) tipIndex = 0;
          this.loadingTip.string = loadTip[lang][tipIndex];
        })
      )
      .repeatForever()
      .start();
  }

  /**
   * 設置載入完成事件
   * @param event
   */
  public setCompleteEvent(event: Function) {
    this.onComplete = event;
  }

  /**
   * 設置進度條百分比
   * @param percent 0 ~ 1
   * @param taskName
   * @param totalItem 預計載入總數 影響進度權重
   */
  public setProgress(percent: number, taskName = 'Loading', totalItem = 1) {
    if (percent < 0) return;
    //不存在任務則自動建立
    if (!this.loadTaskList[taskName]) this.addLoadTask(taskName, 1, 1);
    //取得載入任務
    let loadTask: LoadTask = this.loadTaskList[taskName];
    loadTask.totalItem = totalItem > 0 ? totalItem : 1;
    //任務進度
    if (percent > loadTask.progress)
      //防止進度條回退
      loadTask.progress = percent;

    //所有任務進度總和計算
    let totalProgress = 0; //0 ~ 1
    let sumWeight = 0;
    for (const key in this.loadTaskList) {
      loadTask = this.loadTaskList[key];
      //任務進度權重占比
      totalProgress += loadTask.progress * loadTask.weight * loadTask.totalItem;
      //任務權重加總
      sumWeight += loadTask.weight * loadTask.totalItem;
    }
    loadTask = null;
    //各任務權重占比不一 相加最終未必為1 須除權種加總
    totalProgress /= sumWeight;
    totalProgress *= this.loadingLineCount / this.loadingMerge;
    //更新總進度
    this.beginTotalProgress = this.lastTotalProgress = this.totalProgress;
    this.totalProgress = totalProgress || 0;
    if (this.updateProgressTween) this.updateProgressTween.start();
    //任務進度完成 (須放在最後 避免完成事件清空任務導致異常)
    //因完成事件會在進度完成後才觸發 故延遲處理
    if (percent >= 1) {
      director.once(
        Director.EVENT_AFTER_UPDATE,
        this.setProgressComplete.bind(this, taskName),
        this
      );
    }
  }

  /**
   * 增加載入任務
   * 同名重複新增無效
   * @param taskName
   * @param weight
   * @param totalItem 預計載入總數 影響進度權重
   */
  public addLoadTask(taskName: string, weight = 1, totalItem = 1) {
    if (this.loadTaskList[taskName]) return;

    this.loadTaskList[taskName] = {
      progress: 0,
      weight: weight > 0 ? weight : 1,
      totalItem: totalItem > 0 ? totalItem : 1,
      complete: false,
    };
  }

  /**
   * 取得載入任務列表
   */
  public getLoadTaskList(): LoadTaskList {
    return this.loadTaskList;
  }

  /**
   * 設定進度條及文字
   * @param progress
   */
  protected setProgressBarAndText(progress: number) {
    if (progress < 0 || isNaN(progress)) return;

    //進度條物件存在則顯示
    if (this.progressBar) this.progressBar.progress = progress;
    //進度條文字存在則顯示
    if (this.progressText)
      this.progressText.string =
        Number(progress * 100).toFixed(progress < 1 ? 2 : 0) + '%';
    //更新最後總進度
    this.lastTotalProgress = progress;
  }

  /**
   * 設置進度條完成
   * @param taskName
   */
  protected setProgressComplete(taskName = 'Loading') {
    let loadTask: LoadTask = this.loadTaskList[taskName];
    if (!loadTask) return;

    //若未完成則略過
    if (loadTask.progress !== 1) {
      console.warn(
        '[LoadingHandler] SetProgressComplete fail, taskName: %s, progress: %s',
        taskName,
        loadTask.progress
      );
      return;
    }
    //若已設置為完成則略過
    if (loadTask.complete) {
      console.warn(
        '[LoadingHandler] SetProgressComplete fail, taskName: %s, complete: %s',
        taskName,
        loadTask.complete
      );
      return;
    }

    //載入任務設置為完成
    loadTask.complete = true;

    //全部完成時 觸發完成事件
    let isAllComplete = true;
    for (const key in this.loadTaskList) {
      loadTask = this.loadTaskList[key];
      isAllComplete = isAllComplete && loadTask.complete;
    }
    if (!isAllComplete) return;

    //更新進度至合併載入條佔比
    this.beginTotalProgress =
      this.lastTotalProgress =
      this.totalProgress =
        this.loadingLineCount / this.loadingMerge;
    //觸發完成事件
    if (this.onComplete) this.onComplete();

    // 到100%自動顯示close按鈕
    if (this.lastTotalProgress === 1 && !this.firstLoadingFinished) {
      if (this.showOkBtnWhenLoadingEnd) this.showCloseBtnAnimation();
      PlatformEventNotifier.loadingFinished();
      this.firstLoadingFinished = true;
    }
  }

  public showCloseBtnAnimation() {
    // 防止重複演出
    if (this.hasShownCloseBtn) return;
    this.hasShownCloseBtn = true;

    if (!this.progressBarRoot || !this.closeBtn) {
      console.warn(
        '[LoadingHandler] ShowCloseBtnAnimation fail, progressBarRoot or closeBtn is null'
      );
      return;
    }

    this.progressText.node.active = false;
    this.loadingLevelText.node.active = false;

    GAHandler.SendEvent(
      'loading',
      GAEventGameFlow.showLoadingContinueBtn,
      PlatformData.gameName,
      GAHandler.getGameLoadingTime()
    );
    //**BQ埋點 */
    BQLogger.sendShowLoadingContinueBtn();

    const scaleX =
      getWidth(this.closeBtn.node) / getWidth(this.progressBarRoot);
    const btnScaleY =
      getHeight(this.progressBarRoot) / getHeight(this.closeBtn.node);
    const closeBtnTween = tweenNodeEx(this.closeBtn.node)
      .set({opacity: 255, scaleY: btnScaleY})
      .to(0.1, {scale: 1.25})
      .to(0.1, {scale: 1})
      .call(() => {
        this.closeBtn.interactable = true;
      });

    const hideProgressTween = tween(getUIOpacity(this.progressBarRoot)).to(
      0.5,
      {
        opacity: 0,
      }
    );

    // const newColor = new Color(9, 190, 60);
    // tweenNodeEx(this.progressBar.node).to(0.25, {color: newColor}).start();
    tween(this.progressBarRoot.scale)
      .to(0.25, {x: scaleX})
      .call(() => {
        closeBtnTween.start();
        hideProgressTween.start();
      })
      .start();
  }

  //新增關閉按鈕事件
  protected onClickCloseBtn() {
    this.isClickClose = true;

    //播放無聲音效
    if (this.mutedAudio) {
      const audioSrc = this.node.addComponent(AudioSource);
      audioSrc.clip = this.mutedAudio;
      audioSrc.play();
    }
    this.closeBtn.interactable = false;
    setScale(this.closeBtn.node, 1);
    setOpacity(this.closeBtn.node, 0);

    GAHandler.SendEvent(
      'loading',
      GAEventGameFlow.onClickContinueBtn,
      PlatformData.gameName,
      GAHandler.getGameLoadingTime()
    );

    //**BQ埋點 */
    BQLogger.sendClickContinue();
    BQLogger.sendClickPlay();
    tween(this.node.getComponent(UIOpacity))
      .call(() => {
        if (this.onCloseBtnClicked.length) {
          this.onCloseBtnClicked.notify();
        }
      })
      .call(() => {
        this.showLoadingView(false);
      })
      .delay(0.25)
      .call(() => {
        this.onAfterLoadingClosed.notify();
        //**BQ埋點 */
        BQLogger.sendShowInitialScreen();
        PlatformEventNotifier.closeLoading();
        this.resetProgressBar();
      })
      .start();
  }

  protected resetProgressBar() {
    setColor(this.progressBar.node, color(255, 255, 255, 255));
    setScale(this.progressBarRoot, 1);
    setOpacity(this.progressBarRoot, 255);
    this.progressText.node.active = true;
    this.loadingLevelText.node.active = true;
  }
}
