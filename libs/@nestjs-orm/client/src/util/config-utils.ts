import { ConfigId, ConfigInfo, ConfigType, ConfigVariable } from '../model/config.model';

export class ConfigException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

/**
 * Getting value with real tyoe from string (.env or database) representation.
 */
export class ConfigUtils {
  static valueFromString(type: ConfigType, value: string): any {
    switch (type) {
      case ConfigType.String:
        return value;
      case ConfigType.Number:
        return Number(value);
      case ConfigType.Boolean:
        return value === 'true';
      case ConfigType.Date:
        return '?????????????????????????';
      case ConfigType.Timestamp:
        return '?????????????????????????';
      case ConfigType.Array:
      case ConfigType.Object:
        return JSON.parse(value);
      default:
        throw new Error(`${type} : this type not supported yet (value: ${value})`);
    }
  }

  static getTypeName(type: ConfigType): string {
    switch (type) {
      case ConfigType.String:
        return 'String';
      case ConfigType.Number:
        return 'Number';
      case ConfigType.Boolean:
        return 'Boolean';
      case ConfigType.Date:
        return 'Date';
      case ConfigType.Timestamp:
        return 'Timestamp';
      case ConfigType.Array:
        return 'Array';
      case ConfigType.Object:
        return 'Object';
      default:
        throw new Error(`${type} : unknown type`);
    }
  }

  /**
   * To check if config ID exists in descriptor map.
   *
   * @param configId
   * @param configInfoMap
   */
  static checkConfigId<ID extends ConfigId>(configId: ID, configInfoMap: Map<ID, ConfigInfo<ID>>) {
    const info = configInfoMap.get(configId);
    if (!info) {
      const msg = `${configId}: configuration variable not found in descriptors`;
      throw new ConfigException(msg);
    }
  }

  /**
   * To check if config type is valid.
   *
   * @param config target config entry
   * @param type expected type
   */
  static checkVariableType<ID extends ConfigId>(config: ConfigVariable<ID>, type: ConfigType) {
    if (!config) {
      return;
    }
    if (config.type !== type) {
      const msg = `${config.type} : found in variable[${config.configId}], but expected ${type}`;
      throw new ConfigException(msg);
    }
  }

  /**
   * To check if config entry is valid:
   *    - checks if ID from entry can be found in descriptor map
   *    - checks if type of entry is matching with the descriptor
   *
   * @param config
   * @param configInfoMap
   */
  static checkVariable<ID extends ConfigId>(config: ConfigVariable<ID>, configInfoMap: Map<ID, ConfigInfo<ID>>) {
    const info = configInfoMap.get(config.configId);
    if (!info) {
      const msg = `${config.configId}: configuration variable not found in descriptors of ${config.constructor.name}`;
      throw new ConfigException(msg);
    }
    if (config.type !== info.type) {
      const msg = `${config.type} : inconsistent type found for variable[${config.configId}]. Expected type (found in descriptor): ${info.type}`;
      throw new ConfigException(msg);
    }
  }
}
