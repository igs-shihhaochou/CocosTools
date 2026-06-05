import {Component} from 'cc';

/** 儲存各 Singleton 子類別的實例，以建構函式為 key */
const singletonInstances = new Map<new (...args: any[]) => any, any>();

/**
 * Singleton 基底類別
 * 使用方式：class MyClass extends Singleton { ... }
 * 取得實例：MyClass.instance
 */
export class Singleton {
  public static get instance(): any {
    if (!singletonInstances.has(this as any)) {
      singletonInstances.set(this as any, new (this as any)());
    }
    return singletonInstances.get(this as any);
  }
}

/** 儲存各 SingletonComponent 子類別的實例 */
const singletonComponentInstances = new Map<new (...args: any[]) => any, any>();

/**
 * Singleton Component 基底類別（Cocos Creator）
 * 使用方式：class MyComponent extends SingletonComponent { ... }
 * 取得實例：MyComponent.instance（需在 onLoad 後才會有效）
 */
export class SingletonComponent extends Component {
  public static get instance(): any {
    return (singletonComponentInstances.get(this as any) as any) ?? null;
  }

  protected onLoad(): void {
    singletonComponentInstances.set(this.constructor as any, this);
    super.onLoad?.();
  }

  protected release(): void {
    singletonComponentInstances.set(this.constructor as any, null);
  }

  protected onDestroy(): void {
    this.release();
    super.onDestroy?.();
  }
}
