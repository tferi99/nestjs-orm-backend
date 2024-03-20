export class AsyncUtils {
  /**
   * Enumerate an array and calls callback for items synchronously (with await).
   * @param array
   * @param callback
   */
  static async asyncForEach<T>(array: Array<T>, callback: (item: T, index: number) => Promise<void>) {
    if (!array) {
      return;
    }
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index);
    }
  }
}
