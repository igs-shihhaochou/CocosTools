import {
  _decorator,
  Component,
  Asset,
  AssetManager,
  assetManager,
  settings,
  Settings,
} from 'cc';
const {ccclass, menu} = _decorator;

// 記錄已嘗試過的 .bin 檔案（下載失敗的）
const failedBinUrls: Set<string> = new Set();

import {PlatformData} from '../Define/PlatformData';
import BQLogger from '../Log/BQLog/BQLogger';
import {BundleConfigFormat, BundleSettingFormat} from '../Type/CommonDefine';
import {LoadTask, LoadTaskList} from '../UIComponent/LoadingHandler';
import Signal from '../Utility/Signal';
import {ZipBundleLoader} from '../Utility/ZipBundleLoader';
/** 預載依賴的必要資源目錄 */
const preloadResourcesDir = './_resources';
/** Bundle載入任務 */
interface BundleLoadTask {
  /** Bundle名稱 */
  name: string;
  /** 載入進度 */
  progress: number;
  /** 是否載入完成 */
  isComplete: boolean;
  /** 是否為有效任務 */
  isValid: boolean;
  /** 載入進度事件 (progress: number, item?: AssetManager.RequestItem) */
  progressEvent: Signal;
  /** 載入完成事件 */
  completeEvent: Signal;
  /** 載入錯誤事件 (error: Error) */
  errorEvent: Signal;
  /** 載入流程 */
  loadProcess: Function;
}

// 勿刪除這個變數 (zip-bundler 插件會修改這行代碼使其有值)
// 預設應為空陣列, 請注意不要上傳到帶有內容的陣列
const lstZipBundleName: string[] = ['_Root', 'Game', 'GameLoadingPage', 'SlotDynamicUI', 'resources'];

@ccclass('BundleManager')
@menu('CommonModule/Manager/BundleManager')
export default class BundleManager extends Component {
  // #region Singleton
  // ==================================================================================
  /** 取得 Singleton 物件實體 */
  public static get instance(): BundleManager {
    if (!window['bundleManager']) {
      window['bundleManager'] = new BundleManager();
    }
    return window['bundleManager'];
  }
  public static set instance(instance: BundleManager) {
    window['bundleManager'] = instance;
  }

  //==================================================================================
  // #endregion Singleton
  /** Bundle資訊集合 */
  private bundleInfoCollection: BundleConfigFormat = null;
  /** Bundle載入任務列表 (總表) */
  private bundleLoadTaskList: Array<BundleLoadTask> = null;
  /** Bundle載入任務佇列 (下載) */
  private bundleLoadTaskQueue: Array<BundleLoadTask> = null;
  protected override onLoad() {
    // if (BundleManager._instance !== null) {
    //   this.node.destroy();
    //   return;
    // }
    BundleManager.instance = this;
    this.setupBinToCconbFallback();
  }

  /**
   * 設置 .bin 檔案不存在時回退到 .cconb 的邏輯
   * 使用 transformPipeline 攔截並修正資源路徑
   */
  private setupBinToCconbFallback() {
    // 避免重複設置
    if (window['__binToCconbFallbackSetup']) return;
    window['__binToCconbFallbackSetup'] = true;

    // 使用 transformPipeline 攔截資源請求
    assetManager.transformPipeline.append(task => {
      const input = (task.output = task.input);
      for (let i = 0; i < input.length; i++) {
        const item = input[i];
        // 如果是 .bin 檔案且之前下載失敗過，改為 .cconb
        if (item.url && item.url.endsWith('.bin')) {
          if (failedBinUrls.has(item.url)) {
            const cconbUrl = item.url.replace(/\.bin$/, '.cconb');
            console.warn(
              `[BundleManager] Redirecting .bin to .cconb: ${cconbUrl}`
            );
            item.url = cconbUrl;
            item.ext = '.cconb';
          }
        }
      }
    });

    // 監聽下載失敗事件，記錄失敗的 .bin 檔案
    const originalDownload = assetManager.downloader['download'].bind(
      assetManager.downloader
    );
    assetManager.downloader['download'] = (
      id: string,
      url: string,
      type: string,
      options: Record<string, unknown>,
      onComplete: (err: Error | null, data?: unknown) => void
    ) => {
      originalDownload(
        id,
        url,
        type,
        options,
        (err: Error | null, data?: unknown) => {
          if (err && url.endsWith('.bin')) {
            // 記錄失敗的 .bin URL
            failedBinUrls.add(url);
            // 嘗試 .cconb
            const cconbUrl = url.replace(/\.bin$/, '.cconb');
            console.warn(
              `[BundleManager] .bin file not found, trying .cconb: ${cconbUrl}`
            );
            originalDownload(id, cconbUrl, type, options, onComplete);
          } else {
            onComplete(err, data);
          }
        }
      );
    };
  }
  protected override onDestroy() {
    this.release();
  }

  /** zip包清單，為zip-bundler插件在打包時設定的 */
  public get lstZipBundleName(): readonly string[] {
    return lstZipBundleName.slice();
  }

  public async loadZip(
    bundleName: string,
    isRemote: boolean,
    remoteURL = '',
    remoteVer = ''
  ) {
    if (!ZipBundleLoader) return;

    if (ZipBundleLoader.loadedZipNames.indexOf(bundleName) >= 0)
      // 已經載入過
      return;

    if (!isRemote && lstZipBundleName.indexOf(bundleName) === -1)
      // 不是遠程包且不在清單中
      return;

    let path = remoteURL,
      ver = remoteVer;
    if (!isRemote) {
      const bundleVersion = settings.querySettings(
        Settings.Category.ASSETS,
        'bundleVers'
      );
      // 沒有設定路徑或版本，則使用預設值
      if (!path) path = `./assets/${bundleName}`;
      if (!ver) ver = bundleVersion[bundleName];
    }

    ZipBundleLoader.loadedZipNames.push(bundleName);
    await ZipBundleLoader.loadZip(path, ver, isRemote);
  }
  /**
   * 初始化BundleManager
   * @param bundleInfoCollection Bundle資訊集合設定檔
   * @param onComplete
   */
  public async init(
    bundleInfoCollection?: BundleConfigFormat,
    onComplete?: Function
  ) {
    this.bundleInfoCollection = bundleInfoCollection;
    console.log(
      '[BundleManager] Init bundleInfoCollection:',
      JSON.parse(JSON.stringify(this.bundleInfoCollection))
    );
    this.bundleLoadTaskList = [];
    this.bundleLoadTaskQueue = [];
    //載入依賴的必要資源
    try {
      const bundleName = PlatformData.gameConfig.RootBundle as string;
      await this.loadZip(bundleName, false);
      assetManager.loadBundle(
        bundleName,
        (err: Error, bundle: AssetManager.Bundle) => {
          if (!bundle) return;
          bundle.loadDir(
            preloadResourcesDir,
            null,
            (err: Error, assets: Asset[]) => {
              if (err) {
                BQLogger.sendLoadResFailed(preloadResourcesDir, err);
                console.error(
                  '[BundleManager] preload root resources error.',
                  err
                );
              }
              if (assets && assets.length >= 0 && !err) {
                console.log(
                  '%c[BundleManager] preload root resources complete, assets: %O',
                  'color:orange;background:black',
                  assets
                );
                if (onComplete) onComplete();
              }
            }
          );
        }
      );
    } catch (err) {
      BQLogger.sendLoadResFailed(preloadResourcesDir);
      console.error('[BundleManager] preload root resources error.', err);
    }
  }
  /**
   * 釋放BundleManager資源
   */
  public release() {
    this.bundleInfoCollection = null;
    let bundleLoadTask: BundleLoadTask = null;
    for (let i = 0; i < this.bundleLoadTaskList.length; i++) {
      bundleLoadTask = this.bundleLoadTaskList[i];
      this.cleanBundleLoadTask(bundleLoadTask, false);
    }
    this.bundleLoadTaskList = null;
    for (let i = 0; i < this.bundleLoadTaskQueue.length; i++) {
      this.bundleLoadTaskQueue[i] = null;
    }
    this.bundleLoadTaskQueue = null;
    BundleManager.instance = null;
  }
  /**
   * 取得Bundle鍵值
   * @param bundleName Bundle名稱 不可包含斜線或反斜線
   */
  public getBundleKey(bundleName: string): string {
    if (!this.bundleInfoCollection) return '';
    for (const bundleKey in this.bundleInfoCollection) {
      if (this.bundleInfoCollection[bundleKey].Name === bundleName)
        return bundleKey;
    }
    console.warn(`[BundleManager] GetBundleKey by name(${bundleName}) is null`);
    return '';
  }
  /**
   * 取得Bundle名稱
   * @param bundleKey Bundle鍵值 不可包含斜線或反斜線
   */
  public getBundleName(bundleKey: string): string {
    if (!this.bundleInfoCollection) return '';
    const bundleInfo: BundleSettingFormat =
      this.bundleInfoCollection[bundleKey];
    if (!bundleInfo || !bundleInfo.Name) {
      console.warn(
        `[BundleManager] GetBundleName by key(${bundleKey}) is null`
      );
      return '';
    }
    return bundleInfo.Name;
  }
  /**
   * 取得Bundle路徑
   * @param bundleKey Bundle鍵值 不可包含斜線或反斜線
   */
  public getBundlePath(bundleKey: string): string {
    if (!this.bundleInfoCollection) return '';
    const bundleInfo: BundleSettingFormat =
      this.bundleInfoCollection[bundleKey];
    if (!bundleInfo || !bundleInfo.Path) return '';
    const path = `${PlatformData.gameConfig.RemoteResources}./Bundle/${bundleInfo.Path}./${bundleKey}/${bundleInfo.Version ? bundleInfo.Version + '/' : ''}${bundleInfo.Name}`;
    return path;
  }

  /**
   * 取得Prefab路徑
   * @param bundleKey Bundle鍵值 不可包含斜線或反斜線
   */
  public getBundlePrefabPath(bundleKey: string): string {
    if (!this.bundleInfoCollection) return '';
    const bundleInfo: BundleSettingFormat =
      this.bundleInfoCollection[bundleKey];
    if (!bundleInfo || !bundleInfo.Path) return '';
    return this.bundleInfoCollection[bundleKey].PrefabPath;
  }

  /**
   * 取得指定Bundle的依賴BundleKey列表 索引越小越優先
   * 遞迴尋找
   * @param bundleKey Bundle鍵值 不可包含斜線或反斜線
   * @param searchSource 搜尋來源
   */
  public getBundleDependencyList(
    bundleKey: string,
    searchSource?: BundleConfigFormat
  ): Array<string> {
    searchSource = searchSource || this.bundleInfoCollection;
    const dependencyList: Array<string> = new Array<string>();
    if (searchSource) recursiveGetDependentBundle(bundleKey);
    return dependencyList;
    /**
     * 遞迴尋找Bundle依賴
     * @param targetBundle 目標BundleKey
     * @param dependentBundle 依賴BundleKey
     * @param duplicateList 重複BundleKey
     */
    function recursiveGetDependentBundle(
      targetBundle: string,
      dependentBundle = '',
      duplicateList = ''
    ) {
      //console.log(`[BundleManager] RecursiveSetDependentBundle - %ctargetBundle: ${targetBundle}, %cdependentBundle: ${dependentBundle}\n%cbefore dependencyList: %o\nbefore duplicateList: %o`, "background:black;color:#f9f", "background:black;color:#9f9", "color:#99f", dependencyList.toString().split(","), duplicateList.split(","));
      //目標bundle資訊
      let bundleInfo: BundleSettingFormat = searchSource[targetBundle];
      //存在依賴Bundle
      if (dependentBundle && dependentBundle !== '') {
        //目標 Bundle是否存在依賴列表
        const targetIndex: number = dependencyList.indexOf(targetBundle);
        //依賴Bundle是否存在依賴列表
        const dependencyIndex: number = dependencyList.indexOf(dependentBundle);
        //依賴Bundle不在依賴列表中
        if (dependencyIndex === -1) {
          //依賴Bundle插入依賴列表首位
          dependencyList.unshift(dependentBundle);
        } else {
          //目標 Bundle與依賴 Bundle皆存在依賴列表
          if (targetIndex !== -1 && dependencyIndex !== -1) {
            //依賴Bundle在目標Bundle之後
            if (dependencyIndex > targetIndex) {
              //移動依賴Bundle至目標Bundle之前
              dependencyList.splice(dependencyIndex, 1);
              dependencyList.splice(targetIndex, 0, dependentBundle);
            }
            //依賴Bundle存在重複列表
            if (duplicateList.includes(dependentBundle)) {
              console.warn(
                `[BundleManager] RecursiveSetDependentBundle - ${bundleKey} duplicate dependency, targetBundle: ${targetBundle}, dependentBundle: ${dependentBundle}`
              );
              console.warn(
                'dependencyList:',
                dependencyList.toString().split(',')
              );
              console.warn('duplicateList:', duplicateList.split(','));
              return;
            } else {
              //依賴Bundle插入重複列表
              let list: Array<string> = null;
              if (duplicateList !== '') {
                list = duplicateList.split(',');
                list.push(dependentBundle);
              }
              duplicateList = list ? list.toString() : dependentBundle;
            }
          }
        }
        //目標bundle資訊改為依賴Bundle
        targetBundle = dependentBundle;
        bundleInfo = searchSource[dependentBundle];
      }
      //存在依賴Bundle列表
      if (bundleInfo && bundleInfo.Dependency) {
        //依賴順序從頭至尾 故從末端開始
        let dependency = '';
        for (let i: number = bundleInfo.Dependency.length - 1; i >= 0; i--) {
          dependency = bundleInfo.Dependency[i];
          if (dependency === '') {
            console.warn(
              `[BundleManager] RecursiveGetDependentBundle - dependency[${i}] is empty`
            );
            continue;
          }
          recursiveGetDependentBundle(targetBundle, dependency, duplicateList);
        }
      }
    }
  }
  /**
   * 取得指定Bundle內資源
   * * 多語系於路徑無須指定語系
   * @param bundleName Bundle名稱 不可包含斜線或反斜線
   * @param path 檔案路徑
   * @param type 檔案類型
   * @param lang 語系 (多語系才須指定)
   */
  public getAsset<T extends Asset>(
    bundleName: string,
    path: string,
    type?: typeof Asset,
    lang?: string
  ): T {
    if (!BundleManager.instance) return null;
    //取得bundle
    const bundle: AssetManager.Bundle = assetManager.bundles.get(bundleName);
    if (!bundle) {
      console.warn(`[BundleManager] GetAsset: ${bundleName}(bundle) is null`);
      return null;
    }
    //取得asset
    let asset = null;
    if (!lang) {
      asset = bundle.get('./' + path, type);
    } else {
      asset = bundle.get('./' + lang + '/' + path, type);
      //多語系未取得指定語系資源 改取得預設語系資源
      if (!asset && lang !== PlatformData.gameSetting.DefaultLang) {
        console.warn(
          `[BundleManager] GetAsset: ${bundleName} > ${'/' + lang + '/' + path}(${type ? type.name : null}) is null, try default lang: ${PlatformData.gameSetting.DefaultLang}`
        );
        lang = PlatformData.gameSetting.DefaultLang as string;
        asset = bundle.get('./' + lang + '/' + path, type);
      }
    }
    if (!asset)
      console.warn(
        `[BundleManager] GetAsset: ${bundleName} > ${(lang ? '/' + lang : '') + '/' + path}(${type ? type.name : null}) is null`
      );
    return asset;
  }
  /**
   * 依Bundle鍵值預載Bundle
   * @param bundleKey Bundle鍵值 不可包含斜線或反斜線
   * @param onComplete
   * @param onError
   */
  public preloadBundleByKey(
    bundleKey: string,
    onComplete?: (bundle: AssetManager.Bundle) => void,
    onError?: (err: Error) => void
  ) {
    if (!BundleManager.instance) return;
    const bundleName: string = this.getBundleName(bundleKey);
    this.preloadBundle(
      bundleName,
      onComplete,
      onError,
      this.getBundlePath(bundleKey)
    );
  }
  /**
   * 依Bundle名稱預載Bundle
   * @param bundleName Bundle名稱 不可包含斜線或反斜線
   * @param onComplete
   * @param onError
   * @param remoteBundleURL 遠端資源位址
   */
  public async preloadBundle(
    bundleName: string,
    onComplete?: (bundle: AssetManager.Bundle) => void,
    onError?: (err: Error) => void,
    remoteBundleURL?: string
  ) {
    if (!BundleManager.instance) return;
    const bundle: AssetManager.Bundle = assetManager.getBundle(bundleName);
    if (bundle) {
      if (onComplete) {
        onComplete(bundle);
      }
      return;
    }
    await this.loadZip(bundleName, Boolean(remoteBundleURL), remoteBundleURL);
    assetManager.loadBundle(
      remoteBundleURL ? remoteBundleURL : bundleName,
      (err: Error, bundle: AssetManager.Bundle) => {
        if (err) {
          console.error(
            `[BundleManager] PreloadBundle ${bundleName}(${remoteBundleURL}) error.`,
            err
          );
          if (onError) onError(err);
          return;
        }
        if (onComplete) onComplete(bundle);
      }
    );
  }
  /**
   * 以Bundle鍵值載入Bundle全部資源
   * * 多語系則以Bundle內資料夾路徑切分語系
   * @param bundleKey Bundle鍵值 不可包含斜線或反斜線
   * @param lang 語系 (多語系才須指定)
   * @param onProgress
   * @param onComplete
   * @param onError
   * @param loadDependency 是否載入依賴的Bundle
   */
  public loadBundleAssetsByKey(
    bundleKey: string,
    lang?: string,
    onProgress?: (progress: number) => void,
    onComplete?: Function,
    onError?: (err: Error) => void,
    loadDependency = false
  ) {
    if (!BundleManager.instance) return;
    //載入任務集合
    let loadTaskCollection: LoadTaskList = {};
    //#region 內部處理函式
    //載入進度
    const onProgressInternal: (bundleName: string, progress: number) => void = (
      bundleName: string,
      progress: number
    ) => {
      if (!loadTaskCollection) return;
      //計算總進度
      let totalProgress = 0;
      let totalWeight = 0;
      let loadTask: LoadTask = null;
      for (const key in loadTaskCollection) {
        loadTask = loadTaskCollection[key];
        if (key === bundleName) loadTask.progress = progress;
        totalProgress += loadTask.progress * loadTask.weight;
        totalWeight += loadTask.weight;
      }
      //事件
      if (onProgress instanceof Function)
        onProgress(totalProgress / totalWeight);
    };
    //載入完成
    const onCompleteInternal: (bundleName: string) => void = (
      bundleName: string
    ) => {
      if (!loadTaskCollection) return;
      //是否全完成
      let isAllComplete = true;
      let loadTask: LoadTask = null;
      for (const key in loadTaskCollection) {
        loadTask = loadTaskCollection[key];
        if (key === bundleName) {
          loadTask.progress = 1;
          loadTask.complete = true;
        }
        isAllComplete = isAllComplete && loadTask.complete;
      }
      //若非全完成狀態 略過
      if (!isAllComplete) return;
      //清除載入任務集合
      clearLoadTaskCollection();
      //事件
      if (onComplete instanceof Function) onComplete();
    };
    //載入失敗
    const onErrorInternal: (err: Error) => void = (err: Error) => {
      if (onError instanceof Function === false) return;
      //清除載入任務集合
      clearLoadTaskCollection();
      loadTaskCollection = null;
      //事件
      if (onError instanceof Function) {
        onError(err);
        //只觸發一次錯誤
        onError = null;
      }
      //只觸發一次錯誤
      onError = null;
    };
    //#endregion 內部處理函式
    //取得Bundle資訊 若無則不繼續後續處理
    let bundleInfo: BundleSettingFormat = this.bundleInfoCollection[bundleKey];
    if (!bundleInfo) {
      const errorMsg = `[BundleManager] LoadBundleAssetsByKey get ${bundleKey} bundleInfo fail.`;
      console.error(errorMsg);
      onErrorInternal(new Error(errorMsg));
      return;
    }
    const bundleName: string = bundleInfo.Name;
    //新增載入任務 (主要載入對象須先新增 避免依賴的對象已載入造成誤判為已完成)
    AddLoadTask(bundleName, bundleInfo.Weight);
    //載入依賴Bundle
    if (loadDependency) {
      const dependencyList: Array<string> =
        this.getBundleDependencyList(bundleKey);
      let dependentBundleKey = '';
      for (let i = 0; i < dependencyList.length; i++) {
        dependentBundleKey = dependencyList[i];
        //取得Bundle資訊
        bundleInfo = this.bundleInfoCollection[dependentBundleKey];
        const dependentBundleName: string = bundleInfo.Name; //因每個事件都要獨立名稱 故使用區域變數
        //新增載入任務
        AddLoadTask(dependentBundleName, bundleInfo.Weight);
        //載入Bundle
        this.loadBundleAssetsByKey(
          dependentBundleKey,
          bundleInfo.MultiLang ? lang || PlatformData.lang : null, //多語系優先序 參數 > 共用
          onProgress
            ? (progress: number) => {
                onProgressInternal(dependentBundleName, progress);
              }
            : null,
          onComplete
            ? () => {
                onCompleteInternal(dependentBundleName);
              }
            : null,
          onError ? onErrorInternal : null
        );
      }
    }
    console.log(
      '[BundleManager] LoadBundleAssetsByKey loadTaskCollection:',
      JSON.parse(JSON.stringify(loadTaskCollection))
    );
    //未支援多語系卻設定語系的警示
    if (!bundleInfo.MultiLang && lang) {
      lang = undefined;
      console.warn(
        `[BundleManager] LoadBundleAssetsByKey ${bundleKey}(${bundleName}) is not support multi lang`
      );
    }
    //載入Bundle
    this.loadBundleAssets(
      bundleName,
      lang,
      onProgress
        ? (finish: number, total: number) => {
            onProgressInternal(bundleName, finish / total);
          }
        : null,
      onComplete
        ? () => {
            onCompleteInternal(bundleName);
          }
        : null,
      onError ? onErrorInternal : null,
      this.getBundlePath(bundleKey)
    );
    /**
     * 設定載入任務
     * @param bundleName
     * @param weight
     */
    function AddLoadTask(bundleName: string, weight = 1) {
      if (!loadTaskCollection) return;
      if (loadTaskCollection[bundleName])
        console.warn(
          `[BundleManager] LoadBundleAssetsByKey - AddLoadTask duplicate add ${bundleName}`
        );
      loadTaskCollection[bundleName] = {
        progress: 0,
        weight: weight > 0 ? weight : 1,
        totalItem: 1,
        complete: false,
      };
    }
    /**
     * 清除載入任務集合
     */
    function clearLoadTaskCollection() {
      if (!loadTaskCollection) return;
      for (const bundleName in loadTaskCollection) {
        delete loadTaskCollection[bundleName];
      }
      loadTaskCollection = null;
    }
  }
  /**
   * 以Bundle名稱載入Bundle全部資源
   * * 多語系則以Bundle內資料夾路徑切分語系
   * * 若載入錯誤時仍會繼續載入佇列中的Bundle
   * @param bundleName Bundle名稱 不可包含斜線或反斜線
   * @param lang 語系 (多語系才須指定)
   * @param onProgress
   * @param onComplete
   * @param onError
   * @param remoteBundleURL 遠端Bundle路徑
   */
  public async loadBundleAssets(
    bundleName: string,
    lang?: string,
    onProgress?: (
      finish: number,
      total: number,
      item?: AssetManager.RequestItem
    ) => void,
    onComplete?: Function,
    onError?: (err: Error) => void,
    remoteBundleURL?: string
  ) {
    if (!BundleManager.instance) return;
    // Launcher 模式：本地沒有的 Bundle 從遊戲既有部署路徑載入（含 zip）
    if (PlatformData.isLauncherMode && !remoteBundleURL) {
      const localBundle = assetManager.getBundle(bundleName);
      if (!localBundle) {
        const gameName = PlatformData.gameName;
        const ver = PlatformData.version;
        if (gameName && ver) {
          const gameAssetsBase = `../../../${gameName}/${ver}/${gameName}/assets`;
          // remoteBundleURL 指向 bundle 目錄（assetManager.loadBundle 用）
          remoteBundleURL = `${gameAssetsBase}/${bundleName}`;
        }
      }
    }
    //是否為新的Bundle載入任務
    let isNewBundleLoadTask = false;
    //先嘗試取得Bundle載入任務
    let bundleLoadTask: BundleLoadTask = this.GetBundleLoadTask(bundleName);
    //若未取得則新增Bundle載入任務至列表
    if (!bundleLoadTask) {
      bundleLoadTask = this.AddBundleLoadTask(bundleName);
      isNewBundleLoadTask = true;
    } else {
      console.warn(
        `[BundleManager] LoadBundleAssets ${bundleName} bundleLoadTask already exists, complete: ${bundleLoadTask.isComplete}, valid: ${bundleLoadTask.isValid}`
      );
    }
    //已完成狀態 不繼續後續處理
    if (bundleLoadTask.isComplete) {
      if (onProgress instanceof Function) onProgress(1, 1);
      if (onComplete instanceof Function) onComplete();
      return;
    }
    //#region 註冊事件
    //進度事件
    if (onProgress instanceof Function) {
      bundleLoadTask.progressEvent.add(
        (progress: number, item?: AssetManager.RequestItem) => {
          onProgress(progress, 1, item);
        },
        this
      );
    }
    //完成事件
    if (onComplete instanceof Function) {
      bundleLoadTask.completeEvent.add(onComplete, this);
    }
    //錯誤事件
    if (onError instanceof Function) {
      bundleLoadTask.errorEvent.add(onError, this);
      bundleLoadTask.errorEvent.add(() => {
        BQLogger.sendLoadResFailed(bundleName);
      }, this);
    }
    //#endregion 註冊事件
    //已存在的Bundle載入任務 不繼續後續處理
    if (!isNewBundleLoadTask) return;
    //#region 內部處理函式
    //載入進度
    const onProgressInternal: (
      finish: number,
      total: number,
      item: AssetManager.RequestItem
    ) => void = (
      finish: number,
      total: number,
      item: AssetManager.RequestItem
    ) => {
      if (!bundleLoadTask.isValid) return;
      bundleLoadTask.progress = finish / total;
      bundleLoadTask.progressEvent.dispatch(bundleLoadTask.progress, item);
    };
    //載入完成
    const onCompleteInternal: (err?: Error) => void = (err?: Error) => {
      if (!bundleLoadTask.isValid) return;
      //設定為完成狀態
      bundleLoadTask.isComplete = true;
      //觸發事件
      if (!err) {
        //Bundle載入任務完成事件
        bundleLoadTask.completeEvent.dispatch();
      } else {
        //Bundle載入任務錯誤事件
        bundleLoadTask.errorEvent.dispatch(err);
      }
      //清除Bundle載入任務內容
      this.cleanBundleLoadTask(bundleLoadTask);
      //執行下一個Bundle載入任務
      this.ExecuteNextBundleLoadTask(bundleName);
    };
    //#endregion 內部處理函式
    let getBundleError: Error = null;
    //取得bundle
    let targetBundle: AssetManager.Bundle = assetManager.getBundle(bundleName);
    //若未取得則載入Bundle
    if (!targetBundle) {
      //載入Bundle
      await new Promise((resolve: Function) => {
        this.preloadBundle(
          bundleName,
          (bundle: AssetManager.Bundle) => {
            targetBundle = bundle;
            resolve();
          },
          (err: Error) => {
            console.error(
              `[BundleManager] LoadBundleAssets ${bundleName}(${remoteBundleURL}) error.`,
              err
            );
            getBundleError = err;
            resolve();
          },
          remoteBundleURL
        );
      });
    }
    //取得Bundle錯誤 不繼續後續處理
    if (getBundleError) {
      console.error(
        `[BundleManager] LoadBundleAssets get ${bundleName} error.`,
        getBundleError
      );
      onCompleteInternal(getBundleError);
      return;
    }
    //設定載入流程
    bundleLoadTask.loadProcess = this.LoadAssets.bind(
      this,
      targetBundle,
      lang,
      onProgressInternal,
      onCompleteInternal
    );
    //載入開始
    if (
      this.bundleLoadTaskQueue.length > 0 &&
      this.bundleLoadTaskQueue[0].loadProcess
    ) {
      bundleLoadTask.loadProcess();
      //執行後清除
      bundleLoadTask.loadProcess = null;
    }
  }
  /**
   * 從Bundle載入指定資源
   * * 多語系於路徑無須指定語系
   * @param bundleName Bundle名稱 不可包含斜線或反斜線
   * @param path 資源路徑
   * @param path 資源類型
   * @param lang 語系 (多語系才須指定)
   * @param onProgress
   * @param onComplete
   * @param onError
   */
  public loadAssetFromBundle<T extends Asset>(
    bundleName: string,
    path: string,
    lang?: string,
    type?: typeof Asset,
    onProgress?: (progress: number) => void,
    onComplete?: (asset: T) => void,
    onError?: (err: Error) => void
  ) {
    const bundle: AssetManager.Bundle = assetManager.getBundle(bundleName);
    if (!bundle) {
      if (onError)
        onError(
          new Error(
            `[BundleManager] LoadAssetFromBundle get ${bundleName} bundle is null.`
          )
        );
      return;
    }
    const assetPath: string = (lang ? lang + '/' : '') + path;
    const loadAssetByDefaultLang: Function = () => {
      console.warn(
        `[BundleManager] LoadAssetFromBundle ${bundleName}(${assetPath}) load lang ${lang} fail, try default lang ${PlatformData.gameSetting.DefaultLang}`
      );
      //多語系載入未支援的語系 改讀預設語系
      this.loadAssetFromBundle(
        bundleName,
        path,
        PlatformData.gameSetting.DefaultLang as string,
        type,
        onProgress,
        onComplete
      );
    };
    bundle.load(
      assetPath,
      type,
      (finish: number, total: number) => {
        //載入進度
        if (onProgress) onProgress(finish / total);
      },
      (err: Error, asset) => {
        if (err) {
          if (lang && lang !== PlatformData.gameSetting.DefaultLang) {
            loadAssetByDefaultLang();
          } else {
            console.error(
              `[BundleManager] LoadAssetFromBundle ${bundleName}(${assetPath}) error.`,
              err
            );
            //載入失敗
            if (onError) onError(err);
          }
          return;
        }
        if (asset) {
          //載入完成
          if (onComplete) onComplete(asset as T);
        } else if (lang && lang !== PlatformData.gameSetting.DefaultLang) {
          loadAssetByDefaultLang();
        } else {
          console.warn(
            `[BundleManager] LoadPrefabFromBundle ${bundleName}(${assetPath}) is empty or something wrong.`
          );
          //若為空需做假載入處理
          if (onProgress) onProgress(1);
          //視為完成
          if (onComplete) onComplete(null);
        }
      }
    );
  }
  /**
   * 檢查Bundle是否已載入
   * @param bundleName Bundle名稱 不可包含斜線或反斜線
   */
  public CheckBundleIsLoaded(bundleName: string): boolean {
    const bundle: AssetManager.Bundle = assetManager.getBundle(bundleName);
    return bundle !== null;
  }
  /**
   * 載入Bundle內資源 (LoadBundleAssets的子處理)
   * 多語系若指定語系載入失敗 則載入預設語系
   * @param bundle
   * @param lang 語系 (多語系才須指定)
   * @param onProgress
   * @param onComplete
   */
  private LoadAssets(
    bundle: AssetManager.Bundle,
    lang?: string,
    onProgress?: (
      finish: number,
      total: number,
      item: AssetManager.RequestItem
    ) => void,
    onComplete?: Function
  ) {
    if (!BundleManager.instance) return;
    const bundleName: string = bundle.name;
    //載入Bundle目錄內容
    const dir: string = './' + (!lang ? '' : lang + '/');
    const loadAssetByDefaultLang: Function = () => {
      console.warn(
        `[BundleManager] LoadAssets ${bundleName}(${dir}) load lang ${lang} fail, try default lang ${PlatformData.gameSetting.DefaultLang}`
      );
      //多語系載入未支援的語系 改讀預設語系
      this.LoadAssets(
        bundle,
        PlatformData.gameSetting.DefaultLang as string,
        onProgress,
        onComplete
      );
    };
    bundle.loadDir(dir, onProgress, (err: Error, assets: Array<Asset>) => {
      if (err) {
        if (lang && lang !== PlatformData.gameSetting.DefaultLang) {
          loadAssetByDefaultLang();
        } else {
          console.error(
            `[BundleManager] LoadAssets ${bundleName}(${dir}) error.`,
            err
          );
          //載入失敗
          if (onComplete) onComplete(err);
        }
        return;
      }
      if (assets && assets.length > 0) {
        console.warn(
          '%c[BundleManager] LoadAssets %s(%s) onComplete, assets: %O',
          'color:orange;background:black',
          bundleName,
          dir,
          assets
        );
        //載入完成
        if (onComplete) onComplete();
      } else if (lang && lang !== PlatformData.gameSetting.DefaultLang) {
        loadAssetByDefaultLang();
      } else {
        console.warn(
          `[BundleManager] LoadAssets ${bundleName}(${dir}) is empty or something wrong.`
        );
        //若Bundle為空需做假載入處理
        if (onProgress) onProgress(1, 1, null);
        //視為完成
        if (onComplete) onComplete();
      }
    });
  }
  /**
   * 新增Bundle載入任務
   * (若能取得則不新增)
   * @param bundleName Bundle名稱 不可包含斜線或反斜線
   */
  private AddBundleLoadTask(bundleName: string): BundleLoadTask {
    if (!this.bundleLoadTaskList) return null;
    let bundleLoadTask: BundleLoadTask = this.GetBundleLoadTask(bundleName);
    if (bundleLoadTask)
      console.warn(
        `[BundleManager] AddBundleLoadTask duplicate add ${bundleName}`
      );
    bundleLoadTask = {
      name: bundleName,
      progress: 0,
      isComplete: false,
      isValid: true,
      progressEvent: new Signal(),
      completeEvent: new Signal(),
      errorEvent: new Signal(),
      loadProcess: null,
    };
    this.bundleLoadTaskList.push(bundleLoadTask);
    this.bundleLoadTaskQueue.push(bundleLoadTask);
    return bundleLoadTask;
  }
  /**
   * 移除指定Bundle載入任務
   * @param bundleName Bundle名稱 不可包含斜線或反斜線
   */
  private removeBundleLoadTask(bundleName: string) {
    if (!this.bundleLoadTaskList) return;
    //remove from list
    let bundleLoadTask: BundleLoadTask = null;
    for (let i = 0; i < this.bundleLoadTaskList.length; i++) {
      bundleLoadTask = this.bundleLoadTaskList[i];
      if (bundleLoadTask.name === bundleName) {
        this.cleanBundleLoadTask(bundleLoadTask, false);
        this.bundleLoadTaskList.splice(i, 1);
        break;
      }
    }
    //remove from queue
    for (let i = 0; i < this.bundleLoadTaskQueue.length; i++) {
      if (this.bundleLoadTaskQueue[i].name === bundleName) {
        this.bundleLoadTaskQueue.splice(i, 1);
        break;
      }
    }
  }
  /**
   * 執行下一個Bundle載入任務
   * @param bundleName 完成的Bundle名稱
   */
  private ExecuteNextBundleLoadTask(bundleName: string) {
    if (!this.bundleLoadTaskQueue) {
      console.warn(
        '[BundleManager] ExecuteNextBundleLoadTask this.bundleLoadTaskQueue = null'
      );
      return;
    }
    //remove from queue
    this.bundleLoadTaskQueue.splice(
      this.bundleLoadTaskQueue.findIndex(
        loadTask => loadTask.name === bundleName
      ),
      1
    );
    //load next
    const firstBundleLoadTask: BundleLoadTask = this.bundleLoadTaskQueue[0];
    if (
      this.bundleLoadTaskQueue.length > 0 &&
      firstBundleLoadTask.loadProcess
    ) {
      firstBundleLoadTask.loadProcess();
      //執行後清除
      firstBundleLoadTask.loadProcess = null;
    }
  }
  /**
   * 取得Bundle載入任務
   * @param bundleName Bundle名稱 不可包含斜線或反斜線
   */
  private GetBundleLoadTask(bundleName: string): BundleLoadTask {
    if (!this.bundleLoadTaskList) return null;
    return this.bundleLoadTaskList.find(
      loadTask => loadTask.name === bundleName
    );
  }
  /**
   * 清除Bundle載入任務內容
   * @param bundleLoadTask Bundle載入任務
   * @param isValid 是否有效
   */
  private cleanBundleLoadTask(bundleLoadTask: BundleLoadTask, isValid = true) {
    if (!bundleLoadTask.isValid) return;
    if (bundleLoadTask.progressEvent !== null)
      bundleLoadTask.progressEvent.dispose();
    bundleLoadTask.progressEvent = null;
    if (bundleLoadTask.completeEvent !== null)
      bundleLoadTask.completeEvent.dispose();
    bundleLoadTask.completeEvent = null;
    if (bundleLoadTask.errorEvent !== null) bundleLoadTask.errorEvent.dispose();
    bundleLoadTask.errorEvent = null;
    bundleLoadTask.loadProcess = null;
    bundleLoadTask.isValid = isValid;
  }
}
