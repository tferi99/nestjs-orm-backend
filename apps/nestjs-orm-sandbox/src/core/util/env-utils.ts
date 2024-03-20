import { BoolUtils } from './bool-utils';
import { NumUtils } from './num-utils';

export class EnvUtils {
  static getBooleanValue(envBoolVar: string, defaultVal?: boolean): boolean {
    const val: string = EnvUtils.getValue(envBoolVar, defaultVal);
    if (!val) {
      return defaultVal ?? false;
    }
    return BoolUtils.toBoolean(val);
  }

  static getNumberValue(envBoolVar: string, defaultVal?: number): number {
    const val: string = EnvUtils.getValue(envBoolVar, defaultVal);
    if (!val) {
      return defaultVal ?? 0;
    }
    return NumUtils.toNumber(val);
  }

  static getValue(envVar: string, defaultVal?: any): string {
    const val: string = process.env[envVar];
    if (val === undefined) {
      if (defaultVal === undefined) {
        throw new Error(envVar + ' : variable not found in ENV file');
      }
      return defaultVal.toString();
    }
    return val;
  }

  static isProduction(): boolean {
    return !EnvUtils.isDevelopment();
  }

  static isDevelopment(): boolean {
    return EnvUtils.getBooleanValue('DEVELOPMENT');
  }

  static isTesting(): boolean {
    return EnvUtils.getBooleanValue('TESTING');
  }
}
