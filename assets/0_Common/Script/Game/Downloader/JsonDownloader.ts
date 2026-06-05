import Downloader from '../../../../CommonModule/Script/Utility/Downloader';

export default class JsonDownloader extends Downloader {
  private onLoad: Function = null;
  private onError: (err: Error) => void = null;
  public getContent(
    path: string,
    onLoadCallback?: (jsonData: JSON) => void,
    onErrorCallback?: (err: Error) => void,
    addDateParam = true
  ) {
    this.onLoad = onLoadCallback;
    this.onError = onErrorCallback;
    this.getJSON(
      path,
      this.onLoadComplete.bind(this),
      this.onError.bind(this),
      addDateParam
    );
  }
  private onLoadComplete(jsonStr: string) {
    try {
      let jsonData: JSON = null;
      jsonData = JSON.parse(jsonStr);
      if (this.onLoad !== null) this.onLoad(jsonData);
    } catch (err) {
      console.error('[JsonDownloader] load failed.', err);
      if (this.onError !== null) this.onError(err as Error);
    }
  }
}
