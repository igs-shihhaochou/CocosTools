export class Queue<T> {
  private store: T[] = [];

  front(): T {
    return this.store[0];
  }

  dequeue(): T {
    if (this.store.length <= 0) {
      console.log('Queue Element Not Exist ');
      return null;
    }

    const value: T = this.store[0];
    this.store.shift();

    return value;
  }

  enqueue(value: T) {
    this.store.push(value);
  }

  clear() {
    this.store = [];
  }

  get count(): number {
    return this.store.length;
  }
}
