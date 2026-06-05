export class Dictionary<T, U> {
  private _keys: T[] = [];
  private _values: U[] = [];

  private undefinedKeyErrorMessage =
    'Key is either undefined, null or an empty string.';

  private isEitherUndefinedNullOrStringEmpty(object): boolean {
    return (
      typeof object === 'undefined' ||
      object === null ||
      object.toString() === ''
    );
  }

  private checkKeyAndPerformAction(
    action: {(key: T, value?: U): void | U | boolean},
    key: T,
    value?: U
  ): void | U | boolean {
    if (this.isEitherUndefinedNullOrStringEmpty(key)) {
      throw new Error(this.undefinedKeyErrorMessage);
    }

    return action(key, value);
  }

  public add(key: T, value: U): void {
    const addAction = (key: T, value: U): void => {
      if (this.containsKey(key)) {
        throw new Error(
          'An element with the same key already exists in the dictionary.'
        );
      }

      this._keys.push(key);
      this._values.push(value);
    };

    this.checkKeyAndPerformAction(addAction, key, value);
  }

  public remove(key: T): boolean {
    const removeAction = (key: T): boolean => {
      if (!this.containsKey(key)) {
        return false;
      }

      const index = this._keys.indexOf(key);
      this._keys.splice(index, 1);
      this._values.splice(index, 1);

      return true;
    };

    return <boolean>this.checkKeyAndPerformAction(removeAction, key);
  }

  public getValue(key: T): U {
    const getValueAction = (key: T): U => {
      if (!this.containsKey(key)) {
        return null;
      }

      const index = this._keys.indexOf(key);
      return this._values[index];
    };

    return <U>this.checkKeyAndPerformAction(getValueAction, key);
  }

  public containsKey(key: T): boolean {
    const containsKeyAction = (key: T): boolean => {
      if (this._keys.indexOf(key) === -1) {
        return false;
      }
      return true;
    };

    return <boolean>this.checkKeyAndPerformAction(containsKeyAction, key);
  }

  public popValue(key: T): U {
    const getValueAction = (key: T): U => {
      if (!this.containsKey(key)) {
        return null;
      }

      const index = this._keys.indexOf(key);
      const result: U = this._values[index];
      this._keys.splice(index, 1);
      this._values.splice(index, 1);
      return result;
    };

    return <U>this.checkKeyAndPerformAction(getValueAction, key);
  }

  public changeValueForKey(key: T, newValue: U): void {
    const changeValueForKeyAction = (key: T, newValue: U): void => {
      if (!this.containsKey(key)) {
        throw new Error(
          'In the dictionary there is no element with the given key.'
        );
      }

      const index = this._keys.indexOf(key);
      this._values[index] = newValue;
    };

    this.checkKeyAndPerformAction(changeValueForKeyAction, key, newValue);
  }

  public keys(): T[] {
    return this._keys;
  }

  public values(): U[] {
    return this._values;
  }

  public count(): number {
    return this._values.length;
  }

  public clear(): void {
    this._keys = [];
    this._values = [];
  }
}
