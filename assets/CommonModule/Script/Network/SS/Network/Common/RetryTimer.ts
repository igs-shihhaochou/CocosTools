export class RetryTimer {
  private timerID;
  private iNowTime = 0;
  private iNowRetryTimes = 0;

  private arrayRetryTime: number[];
  private timeoutHandler;
  private retryHandler;

  constructor() {}

  public Start(
    retryHandler: any,
    timeoutHandler: any,
    arrayRetryTime: number[]
  ) {
    this.retryHandler = retryHandler;
    this.timeoutHandler = timeoutHandler;
    this.arrayRetryTime = arrayRetryTime;

    this.timerID = setInterval(this._RetryTimer.bind(this), 1000);
  }

  public ResetTimes() {
    this.iNowTime = 0;
    this.iNowRetryTimes = 0;
  }

  public Stop() {
    clearInterval(this.timerID);

    this.iNowTime = 0;
    this.iNowRetryTimes = 0;
    this.arrayRetryTime = null;
    this.timeoutHandler = null;
    this.retryHandler = null;
  }

  private _RetryTimer(): void {
    console.log(
      '[RetryTimer._RetryTimer] ',
      Date.now,
      ' iNowTime = ',
      this.iNowTime
    );

    this.iNowTime += 1;

    if (this.iNowRetryTimes < this.arrayRetryTime.length) {
      if (this.iNowTime >= this.arrayRetryTime[this.iNowRetryTimes]) {
        console.log(
          '[RetryTimer._RetryTimer] ',
          Date.now,
          ' iNowRetryTimes = ',
          this.iNowRetryTimes
        );

        if (this.retryHandler != null) this.retryHandler();
        else console.error('retryHandler is null');

        this.iNowTime = 0;
        this.iNowRetryTimes += 1;
      }
    } else {
      this.Stop();

      console.log('_RetryTimer Timeout = ' + Date.now);

      if (this.timeoutHandler != null) this.timeoutHandler();
      else console.error('timeoutHandler is null');
    }
  }
}
