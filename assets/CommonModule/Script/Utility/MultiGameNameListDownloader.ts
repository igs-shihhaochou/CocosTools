import Downloader from './Downloader';

export default class MultiGameNameListDownloader extends Downloader {
  private onLoad: Function = null;
  private onError: (err) => void = null;

  public start(
    Url: string,
    OnloadCallback?: (jsonData) => void,
    OnerrorCallback?: (err) => void
  ) {
    this.onLoad = OnloadCallback;
    this.onError = OnerrorCallback;

    this.getJSON(
      Url + 'MultiGameName.json',
      this.onLoadComplete.bind(this),
      this.onError.bind(this)
    );
  }

  /**
   * 載Plugin路徑，名字的CB
   */
  private onLoadComplete(JsonStr: string) {
    try {
      const jsonData = JSON.parse(JsonStr);

      if (this.onLoad !== null) {
        this.onLoad(jsonData);
      }
    } catch (err) {
      console.error('[GameListDownloader] Load failed.\n', err);

      if (this.onError !== null) {
        this.onError(err);
      }
    }
  }
}
