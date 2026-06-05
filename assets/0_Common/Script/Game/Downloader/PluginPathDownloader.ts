import Downloader from '../../../../CommonModule/Script/Utility/Downloader';

export default class PluginPathDownloader extends Downloader {
  private onLoad: Function = null;
  private onError: (err: Error) => void = null;
  public Start(
    path: string,
    onLoadCallback?: (jsonData: JSON) => void,
    onErrorCallback?: (err: Error) => void
  ) {
    this.onLoad = onLoadCallback;
    this.onError = onErrorCallback;
    this.getJSON(
      path + 'PluginPathList.json',
      this.onLoadComplete.bind(this),
      this.onError.bind(this)
    );
  }
  public StartGetScript(
    url: string,
    onLoadCallback?: Function,
    onErrorCallback?: (err: Error) => void
  ) {
    this.onLoad = onLoadCallback;
    this.onError = onErrorCallback;
    this.getScript(
      url,
      () => {
        console.log(
          '[PluginPathDownloader] StartGetScript on get script url:',
          url
        );
        this.onLoad();
      },
      this.onError.bind(this)
    );
  }
  private onLoadComplete(jsonStr: string) {
    try {
      let jsonData: JSON = null;
      jsonData = JSON.parse(jsonStr);
      if (this.onLoad !== null) this.onLoad(jsonData);
    } catch (err) {
      console.error('[PluginPathDownloader] load failed.', err);
      if (this.onError !== null) this.onError(err as Error);
    }
  }
}
