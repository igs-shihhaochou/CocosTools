import Downloader from '../../../../CommonModule/Script/Utility/Downloader';

export default class LogoSettingDownloader extends Downloader {
  private OnLoad: Function = null;
  private OnError: (err: any) => void = null;

  public Start(
    Url: string,
    OnLoadCallback?: (jsonData: any) => void,
    OnErrorCallback?: (err: any) => void
  ) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.OnLoad = OnLoadCallback;
    self.OnError = OnErrorCallback;

    self.getJSON(
      Url + 'LogoSetting.json',
      self.OnLoadComplete.bind(this),
      self.OnError.bind(this)
    );
  }

  private OnLoadComplete(JsonStr: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    try {
      const jsonData: JSON = JSON.parse(JsonStr);

      if (self.OnLoad != null) {
        self.OnLoad(jsonData);
      }
    } catch (err) {
      console.error('[LogoSettingDownloader] Load failed.\n', err);

      if (self.OnError != null) {
        self.OnError(err);
      }
    }
  }
}
