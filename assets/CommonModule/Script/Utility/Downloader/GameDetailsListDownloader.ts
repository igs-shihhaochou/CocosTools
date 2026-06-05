import Downloader from '../Downloader';

export default class GameDetailsListDownloader extends Downloader {
  private onLoad: Function = null;
  private onError: (err: Error) => void = null;
  public start(
    url: string,
    onloadCallback?: (jsonData) => void,
    onerrorCallback?: (err: Error) => void
  ) {
    this.onLoad = onloadCallback;
    this.onError = onerrorCallback;

    this.getJSON(
      url + 'GameListSetting.json',
      this.onLoadComplete.bind(this),
      this.onError.bind(this)
    );
  }
  /**
   * 載Plugin路徑，名字的CB
   */
  private onLoadComplete(jsonStr: string) {
    try {
      const jsonData = JSON.parse(jsonStr);

      if (this.onLoad !== null) {
        this.onLoad(jsonData);
      }
    } catch (err) {
      console.error('[GameListDownloader] Load failed.\n', err);

      if (this.onError !== null) {
        this.onError(err as Error);
      }
    }
  }
}
