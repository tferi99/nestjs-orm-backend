import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { AppCfgRepository } from './app-cfg.repository';
import { AppCfg } from './app-cfg.entity';
import { EnvUtils } from '../../util/env-utils';
import { EntityData, EntityManager } from '@mikro-orm/core';
import { APP_CONFIG_VARIABLES, AppConfig, AppConfigId, AppConfigInfo, Auth, ConfigException, ConfigType, ConfigUtils, Feature, MapUtils } from '@nestjs-orm/client';
import { ClientConnectionService } from '../../../client-connection/client-connection.service';
import { AuthorizedRoles } from '../../../client-connection/feature/feature-data-provider-locator.service';
import { INIT_LOG_PREFIX } from '../../../init/init.service';
import { FeatureDataProviderBase } from '../../features/feature-data-provider';

/**
 * Service to manage application level (global) variables.
 *
 * Variables are cached here (populated only during the startup fom database)
 * and a variable is written into database only if it's changed.
 *
 * This service is also {@link FeatureDataProvider} (provides initial data and notifies on data change).
 *
 * See general notes about how configuration works here: {@link ConfigVariable}
 *
 * ########################################################################################
 * HOW TO ADD NEW VARIABLE?
 *  - add variable to .env into AppConfig section
 *  - add descriptor of variable to APP_CONFIG_VARIABLES
 * ########################################################################################
 */
@Injectable()
export class AppConfigService extends FeatureDataProviderBase<AppConfig, AppConfigId> {
  private readonly logger = new Logger(AppConfigService.name);

  /**
   * Cache of user application variables.
   * It's a map of {@link AppConfig} by {@link AppConfigId}.
   */
  private cache = new Map<AppConfigId, AppConfig>();

  private infoMap: Map<AppConfigId, AppConfigInfo> = new Map<AppConfigId, AppConfigInfo>();

  constructor(
    private em: EntityManager,
    private appCfgRepository: AppCfgRepository,
    @Inject(forwardRef(() => ClientConnectionService)) clientConnectionService: ClientConnectionService,
  ) {
    super(Feature.AppConfig, clientConnectionService);
  }

  getAuthorizedRoles(): AuthorizedRoles {
    return 'AnyRole';
  }

  /**
   * It loads config variables from the database, converts entities into configuration variables
   * and populates the cache.
   */
  async init() {
    this.logger.log(INIT_LOG_PREFIX + this.constructor.name + ' initializing...');
    this.infoMap = MapUtils.arrayToMap(APP_CONFIG_VARIABLES, 'configId') as unknown as Map<AppConfigId, AppConfigInfo>;
    let configsFromDb: Map<string, string>;
    try {
      // loading from DB
      const configs = await this.appCfgRepository.findAll();
      configsFromDb = MapUtils.arrayToMap(configs, 'configId', 'value');

      // convert + storing into cache
      this.initVariables(configsFromDb);
    } catch (e) {
      this.logger.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      this.logger.error('Error during initialization of application configuration.', e);
      console.log('ERROR: ', e);
      this.logger.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    }
    this.logger.log(INIT_LOG_PREFIX + this.constructor.name + ' initialized');
  }

  async getAll(): Promise<AppConfig[]> {
    return Array.from(this.cache.values());
  }

  getString(configId: AppConfigId): string {
    const cfg = this.getVariable(configId);
    ConfigUtils.checkVariableType(cfg, ConfigType.String);
    return cfg.value;
  }

  async setString(configId: AppConfigId, value: string): Promise<void> {
    await this.setVariable({ configId, type: ConfigType.String, value });
  }

  getNumber(configId: AppConfigId): number {
    const cfg = this.getVariable(configId);
    ConfigUtils.checkVariableType(cfg, ConfigType.Number);
    return cfg.value;
  }

  async setNumber(configId: AppConfigId, value: number): Promise<void> {
    await this.setVariable({ configId, type: ConfigType.Number, value });
  }

  getBoolean(configId: AppConfigId): boolean {
    const cfg = this.getVariable(configId);
    ConfigUtils.checkVariableType(cfg, ConfigType.Boolean);
    return cfg.value;
  }

  async setBoolean(configId: AppConfigId, value: boolean): Promise<void> {
    await this.setVariable({ configId, type: ConfigType.Boolean, value });
  }

  /**
   * Getting variable from the cache.
   *
   * @param configId
   */
  getVariable(configId: AppConfigId): AppConfig {
    const config = this.cache.get(configId);
    if (config === undefined) {
      ConfigUtils.checkConfigId(configId, this.infoMap);
      const msg = `${configId} : application variable not found in cache (get)`;
      this.logger.error(msg);
      throw new ConfigException(msg);
    }
    return config;
  }

  async setVariable(config: AppConfig): Promise<AppConfig> {
    const foundInCache = this.getVariable(config.configId);
    if (!foundInCache) {
      const msg = `${config.configId} : application variable not found in cache (set)`;
      this.logger.error(msg);
      throw new ConfigException(msg);
    }
    ConfigUtils.checkVariableType(foundInCache, config.type);
    await this.applyValue(foundInCache, config.value);

    // broadcast changes
    this.notifyDataChanged(foundInCache);
    return foundInCache;
  }

  //------------------------------- helpers -------------------------------
  /**
   * To apply change to configuration variable:
   *  - flush to database
   *  - apply to original value, too (found in cache)
   *
   * @param original config entry found in cache (or new one already pushed there)
   * @param changedValue new config value
   * @private
   */
  private async applyValue(original: AppConfig, changedValue: any) {
    // flush to database
    const dbVar = await this.appCfgRepository.findOne({ configId: original.configId });
    if (dbVar) {
      dbVar.value = String(changedValue);
    } else {
      const cfg: EntityData<AppCfg> = {
        configId: original.configId,
        type: original.type,
        value: String(changedValue),
      };
      await this.appCfgRepository.create(cfg);
    }
    await this.appCfgRepository.flush();

    // apply to original value, too (found in cache)
    original.value = changedValue;
  }

  /**
   * Initial loading of variables into the cache from .env + database during the startup.
   *
   * It gets all descriptors from {@link APP_CONFIG_VARIABLES} and tries to find values
   * in the following locations in this order:
   *  - .env
   *  - database
   *  - default value from {@AppConfigInfo} descriptor
   *
   *  If value cannot be found then error will be thrown.
   *
   * @param configsFromDb values are still in string format (as loaded from DB)
   * @private
   */
  private initVariables(configsFromDb: Map<string, string>): void {
    const overrideFromDb = EnvUtils.getBooleanValue('OVERRIDE_APP_CONFIG_FROM_DB');

    for (const cfgInfo of APP_CONFIG_VARIABLES) {
      const varName = cfgInfo.configId;
      let value: any = undefined;
      // trying from env
      try {
        switch (cfgInfo.type) {
          case ConfigType.Boolean:
            value = EnvUtils.getBooleanValue(varName);
            break;
          case ConfigType.Number:
            value = EnvUtils.getNumberValue(varName);
            break;
          case ConfigType.String:
            value = EnvUtils.getValue(varName);
            break;
        }
      } catch {
        // ignore if not found in .env, maybe there is a default value from descriptor (or overridden from DB)
      }

      // overriding variable from database
      if (overrideFromDb) {
        const fromDb: string = configsFromDb.get(varName);
        if (fromDb) {
          value = ConfigUtils.valueFromString(cfgInfo.type, fromDb);
        }
      }
      if (value === undefined) {
        if (cfgInfo.defaultValue === undefined) {
          throw new ConfigException(varName + ' : configuration variable not found in .env or in database and no default value defined in descriptor');
        }
        value = ConfigUtils.valueFromString(cfgInfo.type, cfgInfo.defaultValue);
      }
      this.cache.set(cfgInfo.configId, {
        ...cfgInfo,
        value: value,
      });
    }
    //console.log('APP_CONFIG', this.vars);
  }

  async getInitialFeatureData(user: Auth): Promise<AppConfig[]> {
    return this.getAll();
  }
}
