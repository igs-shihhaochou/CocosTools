// /**
//  * @desc Phaser 2.6.2 Signal SignalBinding TypeScript by Ice
//  * @author       Miller Medeiros http://millermedeiros.github.com/js-signals/
//  * @author       Richard Davey <rich@photonstorm.com>
//  * @copyright    2016 Photon Storm Ltd.
//  * @url          https://github.com/photonstorm/phaser/blob/v2.6.2/src/core/Signal.js
//  * @url          https://github.com/photonstorm/phaser/blob/v2.6.2/src/core/SignalBinding.js
//  */
//     //public callCount: number = 0;
//     //public active: boolean = true;
//         //if (this.active && !!this._listener) {
//             //this.callCount++;
//         //return '[SignalBinding isOnce:' + this._isOnce + ', isBound:' + this.isBound() + ', active:' + this.active + ']';

class SignalBinding {
  public context: Object | null = null;
  public priority = 0;
  public params: [] | null = null;
  private _signal: Signal | null = null;
  private _listener: Function | null = null;
  private _isOnce = false;
  private _args: unknown[] | null = null;
  constructor(
    signal: Signal,
    listener: Function,
    isOnce: boolean,
    listenerContext: Object | null = null,
    priority = 0,
    args?: unknown[]
  ) {
    this._listener = listener;
    if (isOnce) {
      this._isOnce = true;
    }
    if (listenerContext !== null) {
      this.context = listenerContext;
    }
    this._signal = signal;
    if (priority) {
      this.priority = priority;
    }
    if (args && args.length) {
      this._args = args;
    }
  }
  public execute(paramsArr?) {
    let handlerReturn = null;
    let params = null;
    if (this._listener && paramsArr) {
      params = this.params ? this.params.concat(paramsArr) : paramsArr;
      if (this._args && params) {
        params = params.concat(this._args);
      }
      handlerReturn = this._listener.apply(this.context, params);
      if (this._isOnce) {
        this.detach();
      }
    }
    return handlerReturn;
  }
  public detach(): Signal | null {
    if (this.isBound() && this._listener) {
      this._signal?.remove(this._listener, this.context);
      return this._signal;
    } else {
      return null;
    }
  }
  public isBound(): boolean {
    return !!this._signal && !!this._listener;
  }
  public isOnce(): boolean {
    return this._isOnce;
  }
  public getListener(): Function | null {
    return this._listener;
  }
  public destroy() {
    this._signal = null;
    this._listener = null;
    this.context = null;
  }
  public toString(): string {
    return (
      '[SignalBinding isOnce:' +
      this._isOnce +
      ', isBound:' +
      this.isBound() +
      ']'
    );
  }
}

export default class Signal {
  public memorize = false;
  public active = true;
  private _bindings: SignalBinding[] | null = null;
  private _prevParams = null;
  private _shouldPropagate = true;
  public validateListener(listener: Function, fnName: string) {
    if (typeof listener !== 'function') {
      throw new Error(
        'listener is a required param of {fn}() and should be a Function.'.replace(
          '{fn}',
          fnName
        )
      );
    }
  }
  private _registerListener(
    listener: Function,
    isOnce: boolean,
    listenerContext: Object | null = null,
    priority = 0,
    args?: unknown[]
  ): SignalBinding {
    const prevIndex: number = this._indexOfListener(listener, listenerContext);
    let binding: SignalBinding | null = null;
    if (prevIndex !== -1 && this._bindings) {
      binding = this._bindings[prevIndex];
      if (binding.isOnce() !== isOnce) {
        throw new Error(
          'You cannot add' +
            (isOnce ? '' : 'Once') +
            '() then add' +
            (!isOnce ? '' : 'Once') +
            '() the same listener without removing the relationship first.'
        );
      }
    } else {
      binding = new SignalBinding(
        this,
        listener,
        isOnce,
        listenerContext,
        priority,
        args
      );
      this._addBinding(binding);
    }
    if (this.memorize && this._prevParams) {
      binding.execute(this._prevParams);
    }
    return binding;
  }
  private _addBinding(binding: SignalBinding) {
    if (!this._bindings) {
      this._bindings = [];
    }
    let n = this._bindings.length;
    do {
      n--;
    } while (
      this._bindings[n] &&
      binding.priority <= this._bindings[n].priority
    );
    this._bindings.splice(n + 1, 0, binding);
  }
  private _indexOfListener(
    listener: Function,
    context: Object | null = null
  ): number {
    if (!this._bindings) {
      return -1;
    }
    if (context === undefined) {
      context = null;
    }
    let n = this._bindings.length;
    let cur: SignalBinding | null = null;
    while (n--) {
      cur = this._bindings[n];
      if (cur.getListener() === listener && cur.context === context) {
        return n;
      }
    }
    return -1;
  }
  public has(listener: Function, context: Object | null = null): boolean {
    return this._indexOfListener(listener, context) !== -1;
  }
  public add(
    listener: Function,
    listenerContext: Object | null = null,
    priority = 0,
    ...args: unknown[]
  ): SignalBinding {
    this.validateListener(listener, 'add');
    return this._registerListener(
      listener,
      false,
      listenerContext,
      priority,
      args
    );
  }
  public addOnce(
    listener: Function,
    listenerContext: Object | null = null,
    priority = 0,
    ...args: unknown[]
  ): SignalBinding {
    this.validateListener(listener, 'addOnce');
    return this._registerListener(
      listener,
      true,
      listenerContext,
      priority,
      args
    );
  }
  public remove(listener: Function, context: Object | null = null): Function {
    this.validateListener(listener, 'remove');
    const i: number = this._indexOfListener(listener, context);
    if (i !== -1 && this._bindings) {
      this._bindings[i].destroy();
      this._bindings.splice(i, 1);
    }
    return listener;
  }
  public removeAll(context: Object | null = null) {
    if (context === undefined) {
      context = null;
    }
    if (!this._bindings) {
      return;
    }
    let n = this._bindings.length;
    while (n--) {
      if (context) {
        if (this._bindings[n].context === context) {
          this._bindings[n].destroy();
          this._bindings.splice(n, 1);
        }
      } else {
        this._bindings[n].destroy();
      }
    }
    if (!context) {
      this._bindings.length = 0;
    }
  }
  public getNumListeners(): number {
    return this._bindings ? this._bindings.length : 0;
  }
  public halt() {
    this._shouldPropagate = false;
  }
  public dispatch(...paramsArr) {
    if (!this.active || !this._bindings) {
      return;
    }
    let n: number = this._bindings.length;
    let bindings: SignalBinding[] | null = null;
    if (this.memorize) {
      this._prevParams = paramsArr;
    }
    if (!n) {
      return;
    }
    bindings = this._bindings.slice();
    this._shouldPropagate = true;
    do {
      n--;
    } while (
      bindings[n] &&
      this._shouldPropagate &&
      bindings[n].execute(paramsArr) !== false
    );
  }
  public forget() {
    if (this._prevParams) {
      this._prevParams = null;
    }
  }
  public dispose() {
    this.removeAll();
    this._bindings = null;
    if (this._prevParams) {
      this._prevParams = null;
    }
  }
  public toString(): string {
    return (
      '[Signal active:' +
      this.active +
      ' numListeners:' +
      this.getNumListeners() +
      ']'
    );
  }
}
