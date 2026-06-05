import Downloader from '../Downloader';

export default class EventIconSettingDownloader extends Downloader {
  private onLoad: Function = null;
  private onError: (err: Error) => void = null;
  public start(
    path: string,
    onLoadCallback?: (jsonData: JSON) => void,
    onErrorCallback?: (err: Error) => void
  ) {
    this.onLoad = onLoadCallback;
    this.onError = onErrorCallback;
    this.getJSON(
      path + 'setting.json',
      this.onLoadComplete.bind(this),
      this.onError.bind(this)
    );
  }
  private onLoadComplete(jsonStr: string) {
    try {
      let jsonData: JSON = null;
      jsonData = JSON.parse(jsonStr);
      if (this.onLoad !== null) this.onLoad(jsonData);
    } catch (err) {
      console.error('[EventIconSettingDownloader] load failed.', err);
      if (this.onError !== null) this.onError(err as Error);
    }
  }
}
