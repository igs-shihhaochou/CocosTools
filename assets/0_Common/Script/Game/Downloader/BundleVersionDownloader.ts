import Downloader from '../../../../CommonModule/Script/Utility/Downloader';

export default class BundleVersionDownloader extends Downloader {
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
      path + 'BundleVersion.json',
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
      console.error('[BundleVersionDownloader] load failed.', err);
      if (this.onError !== null) this.onError(err as Error);
    }
  }
}
