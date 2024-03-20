export class RequestUtils {
  static queryParamToBool(value: string, defaultValue: boolean): boolean {
    if (!value) {
      return defaultValue;
    }
    return (value + '').toLowerCase() === 'true';
  }

  static queryParamToNumber(value: string, defaultValue?: number): number {
    if (!value) {
      if (defaultValue) {
        return defaultValue;
      }
      return 0;
    }
    const n = Number(value);
    if (isNaN(n)) {
      // tslint:disable-next-line:no-console
      console.error('queryParamToNumber() - Bad format of number: ' + value);
      return 0;
    }
    return n;
  }
}
