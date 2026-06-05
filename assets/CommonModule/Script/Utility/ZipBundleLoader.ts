import {assetManager} from 'cc';
import {DEV, PREVIEW, HTML5} from 'cc/env';

const ZipCache = new Map<string, any>();
const ResCache = new Map<string, any>();
const ResCacheJsonVersion = new Map<string, number>();

class _ZipBundleLoader {
  public loadedZipNames = new Array<string>();
  private preloadedBuffersCache: Map<string, ArrayBuffer> | null = null;
  private cacheInitialized = false;
  private initPromise: Promise<void> | null = null;

  private async downloadZip(path: string, md5: string, skipCache = false) {
    const match = path.match(/[^/]+$/);
    if (match === null) {
      return null;
    }

    const name = match[0];
    const filename = `${name}${md5}.zip`;
    const baseFileName = `${name}.zip`;

    // 先檢查預下載的 cache（skipCache 時跳過，用於 Launcher 模式遠端載入）
    if (!skipCache) {
      const zipBuffer = await this.checkIndexHtmlZipCache(baseFileName);
      if (zipBuffer) {
        return zipBuffer;
      }
    }

    // 如果沒有 cache，才下載
    return new Promise<ArrayBuffer | null>(resolve => {
      assetManager.downloader.downloadFile(
        `${path}/${filename}`,
        {xhrResponseType: 'arraybuffer'},
        null,
        (err, data) => {
          resolve(data);
        }
      );
    });
  }

  private async initPreloadedBuffersCache(): Promise<void> {
    // 已完成初始化
    if (this.cacheInitialized) {
      return;
    }

    // 已有初始化流程在跑，直接等同一個 Promise
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    // 建立唯一的初始化流程
    this.initPromise = (async () => {
      this.preloadedBuffersCache = new Map<string, ArrayBuffer>();

      const bundleZipList = (window as any).wzbBundleZipList;
      if (!bundleZipList || bundleZipList.length === 0) {
        console.log('[ZipBundleLoader] No bundle zips to cache');
        this.cacheInitialized = true;
        return;
      }

      const wzbDownloadResCache = (window as any).wzbDownloadResCache;
      if (!wzbDownloadResCache) {
        console.log('[ZipBundleLoader] No pre-downloaded cache available');
        this.cacheInitialized = true;
        return;
      }

      console.log('[ZipBundleLoader] Initializing preloaded buffers cache...');

      let preloadedBuffers: ArrayBuffer[] = [];
      try {
        preloadedBuffers = await Promise.all(wzbDownloadResCache);
      } catch (e) {
        console.error(
          '[ZipBundleLoader] Failed to get pre-downloaded zips:',
          e
        );
        this.cacheInitialized = true;
        return;
      }

      // 建立 filename -> buffer 的映射
      const resZipList = (window as any).wzbResZipList || [];
      for (let i = 0; i < bundleZipList.length; i++) {
        const bundleInfo = bundleZipList[i];
        const bundleBufferIndex = resZipList.length + i;

        if (
          preloadedBuffers &&
          preloadedBuffers.length > bundleBufferIndex &&
          preloadedBuffers[bundleBufferIndex]
        ) {
          const bundleName = bundleInfo.name;
          const buffer = preloadedBuffers[bundleBufferIndex];

          // 存儲多個可能的檔名格式
          this.preloadedBuffersCache.set(bundleName, buffer);
          this.preloadedBuffersCache.set(`${bundleName}.zip`, buffer);

          console.log(
            `[ZipBundleLoader] Cached buffer for: ${bundleName} (${
              buffer.byteLength / 1024
            } KB)`
          );
        }
      }

      console.log(
        `[ZipBundleLoader] Cache initialized with ${this.preloadedBuffersCache.size} entries`
      );

      this.cacheInitialized = true;
    })();

    await this.initPromise;
  }

  private async checkIndexHtmlZipCache(
    filename: string
  ): Promise<ArrayBuffer | null> {
    // 確保緩存已初始化
    await this.initPreloadedBuffersCache();

    if (!this.preloadedBuffersCache || this.preloadedBuffersCache.size === 0) {
      return null;
    }

    // 嘗試多種檔名格式
    const filenameWithoutZip = filename.replace('.zip', '');
    const filenameWithZip = filename.endsWith('.zip')
      ? filename
      : `${filename}.zip`;

    // 直接從緩存查找
    const buffer =
      this.preloadedBuffersCache.get(filename) ||
      this.preloadedBuffersCache.get(filenameWithoutZip) ||
      this.preloadedBuffersCache.get(filenameWithZip);

    if (buffer) {
      console.log(
        `[ZipBundleLoader] Found cached buffer for: ${filename} (${
          buffer.byteLength / 1024
        } KB)`
      );
      return buffer;
    }

    return null;
  }

  public async loadZip(path: string, bundleVers: string, skipCache = false) {
    const md5 = bundleVers ? `.${bundleVers}` : '';
    const zipBuffer = await this.downloadZip(path, md5, skipCache);
    if (zipBuffer !== null) {
      const dirName = path.replace(/(.*?)\/assets\//, 'assets/');
      await new Promise<void>(resolve => {
        try {
          globalThis.fflate.unzip(
            new Uint8Array(zipBuffer),
            (err, unzipped) => {
              if (err) {
                console.warn('Unzip failed:', err.message);
                resolve();
                return;
              }

              // console.log('unzipped:', unzipped);
              Object.keys(unzipped).forEach(key => {
                // 將絕對路徑 & 相對路徑都指向同一個資源
                ZipCache.set(`${path}/${key}`, unzipped[key]);
                ZipCache.set(`${dirName}/${key}`, unzipped[key]);
              });
              resolve();
            }
          );
        } catch (e: any) {
          console.warn('Unzip failed:', e?.message ?? String(e));
          resolve();
        }
      });
    }
  }

  public init() {
    if (!globalThis.fflate) {
      console.error('fflate is not found.');
      return;
    }

    const accessor = Object.getOwnPropertyDescriptor(
      XMLHttpRequest.prototype,
      'response'
    );
    Object.defineProperty(XMLHttpRequest.prototype, 'response', {
      get: function () {
        if (this.ZipCacheUrl) {
          return ResCache.get(this.ZipCacheUrl);
        }
        //@ts-ignore
        return accessor.get.call(this);
      },
      set: function (_str: string) {},
      configurable: true,
    });

    // 攔截 open
    const oldOpen = XMLHttpRequest.prototype.open;
    // @ts-ignore
    XMLHttpRequest.prototype.open = function (
      method,
      url: string,
      _async,
      _user,
      _password
    ) {
      if (ZipCache.has(url as string)) {
        this.ZipCacheUrl = url;
      }
      //@ts-ignore
      // eslint-disable-next-line prefer-rest-params
      return oldOpen.apply(this, arguments);
    };

    // 攔截 send
    const oldSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (_data) {
      if (this.ZipCacheUrl) {
        if (!ResCache.has(this.ZipCacheUrl)) {
          const responseType = this.responseType;
          const cache = ZipCache.get(this.ZipCacheUrl);

          let resData = null as any;
          switch (responseType) {
            case 'arraybuffer': {
              if (cache.buffer)
                resData = cache.buffer; // zip 出來的應該都為 Uint8Array
              else resData = cache;
              break;
            }
            case 'json': {
              const textDecoder = new TextDecoder(); // default 'utf-8' or 'utf8'
              const text = textDecoder.decode(cache);
              resData = JSON.parse(text);
              break;
            }
            case 'text': {
              const textDecoder = new TextDecoder(); // default 'utf-8' or 'utf8'
              resData = textDecoder.decode(cache);
              break;
            }
            default: {
              console.error('Unknown type in zipCache:', responseType);
            }
          }

          const jsonVersionOld = ResCacheJsonVersion.get(this.ZipCacheUrl);
          if (jsonVersionOld) {
            ResCache.delete(`${this.ZipCacheUrl}@version${jsonVersionOld}`);
            ResCacheJsonVersion.delete(this.ZipCacheUrl);
          }

          const jsonVersionNew = performance.now();
          ResCacheJsonVersion.set(this.ZipCacheUrl, jsonVersionNew);

          this.ZipCacheUrl = `${this.ZipCacheUrl}@version${jsonVersionNew}`;
          ResCache.set(this.ZipCacheUrl, resData);
        }
        //@ts-ignore
        this.onload();
        return;
      }
      //@ts-ignore
      // eslint-disable-next-line prefer-rest-params
      return oldSend.apply(this, arguments);
    };
  }
}

let instance = globalThis.__zipBundleLoader as _ZipBundleLoader;
if (!DEV && !PREVIEW && HTML5 && globalThis.fflate && !instance) {
  instance = new _ZipBundleLoader();
  globalThis.__zipBundleLoader = instance;
  instance.init();
}

export {instance as ZipBundleLoader};
