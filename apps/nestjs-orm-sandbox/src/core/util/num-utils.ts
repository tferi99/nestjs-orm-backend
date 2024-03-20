export class NumUtils {
  static toNumber(val: string): number {
    return Number(val ?? '0');
  }
}
