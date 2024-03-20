import * as _ from 'lodash';

export class MapUtils {
  /**
   * Filter map by property of values.
   *
   * @param map
   * @param filterFunction
   */
  static filter<TKey, TValue>(map: Map<TKey, TValue>, filterFunction: (key: TKey, value: TValue) => boolean): Map<TKey, TValue> {
    const filteredMap: Map<TKey, TValue> = new Map<TKey, TValue>();

    map.forEach((value, key) => {
      if (filterFunction(key, value)) {
        filteredMap.set(key, value);
      }
    });

    return filteredMap;
  }

  /**
   * It sorts items of an array by property values into a map of value arrays
   * (where key is the item property value and values are array of original items grouped by property value).
   *
   * @param data
   * @param propName
   *
   * Return: map value arrays by property value
   */
  static sortArrayItemsByProperty<T>(data: T[], propName: keyof T): Map<string, T[]> {
    return _.reduce(
      data,
      (acc: Map<string, any>, item: T) => {
        const key = String(item[propName]);
        let arr: T[] | undefined = acc.get(key);
        if (!arr) {
          arr = [];
          acc.set(key, arr);
        }
        arr.push(item);
        return acc;
      },
      new Map<string, T[]>(),
    );
  }

  /*
  static arrayToMapOLD<T>(data: T[], keyProp: keyof T, valueProp?: keyof T): Map<string, any> {
    return _.reduce(
      data,
      (acc, item) => {
        const key = String(item[keyProp]);
        if (valueProp) {
          acc.set(key, item[valueProp]);
        } else {
          acc.set(key, item);
        }
        return acc;
      },
      new Map<string, any>(),
    );
  }*/

  /**
   * It converts an array items into map by key/value properties.
   *
   * @param data
   * @param keyProp
   * @param valueProp
   */
  static arrayToMap<T, K extends keyof T, ID extends T[K]>(data: T[], keyProp: keyof T, valueProp?: keyof T): Map<ID, any> {
    return _.reduce(
      data,
      (acc: Map<ID, any>, item: T) => {
        const key = item[keyProp] as ID;
        if (valueProp) {
          acc.set(key, item[valueProp]);
        } else {
          acc.set(key, item);
        }
        return acc;
      },
      new Map<ID, any>(),
    );
  }

  static mapToArray<T>(map: Map<any, T>): T[] {
    return Array.from(map.values());
  }

  static mapToObj(tsMap: Map<any, any>) {
    const obj: any = {};
    tsMap.forEach((value: any, key: any) => {
      obj[key] = value;
    });
    return obj;
  }

  static objToMap(jsObj: any): Map<any, any> {
    const tsMap = new Map();
    const arrayOfMapEntries = new Map<any, any>(Object.entries(jsObj));
    for (const [key, value] of arrayOfMapEntries.entries()) {
      tsMap.set(key, value);
    }
    return tsMap;
  }
}
