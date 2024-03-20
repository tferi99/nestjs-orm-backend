import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Auth, ConfigType, Feature, MapUtils, USER_CONFIG_VARIABLES, UserConfig, UserConfigId, UserConfigInfo } from '@nestjs-orm/client';
import { AuthorizedRoles } from '../../../client-connection/feature/feature-data-provider-locator.service';
import { UserCfg } from './user-cfg.entity';
import { UserCfgRepository } from './user-cfg.repository';
import { EntityData, FilterQuery } from '@mikro-orm/core';
import { UserCfgConverter } from './user-cfg-converter';
import { UserRepository } from '../../../feature-modules/admin/user/user.repository';
import { ClientConnectionService } from '../../../client-connection/client-connection.service';
import { INIT_LOG_PREFIX } from '../../../init/init.service';
import { FeatureDataProviderBase } from '../../features/feature-data-provider';
import { ConfigUtils } from '@nestjs-orm/client';

@Injectable()
export class UserConfigService extends FeatureDataProviderBase<UserConfig, UserConfigId> {
  private readonly logger = new Logger(UserConfigService.name);

  /**
   * Cache of user configuration variables.
   * It's a map of {@link UserConfig} by user ID.
   */
  private cache = new Map<number, Map<UserConfigId, UserConfig>>();

  private converter = new UserCfgConverter();
  private infoMap: Map<UserConfigId, UserConfigInfo> = new Map<UserConfigId, UserConfigInfo>();

  //------------------------------------- init -------------------------------------
  constructor(
    private userCfgRepository: UserCfgRepository,
    private userRepository: UserRepository,
    @Inject(forwardRef(() => ClientConnectionService)) clientConnectionService: ClientConnectionService,
  ) {
    super(Feature.UserConfig, clientConnectionService);
  }

  async init() {
    this.logger.log(INIT_LOG_PREFIX + this.constructor.name + ' initializing...');
    this.infoMap = MapUtils.arrayToMap(USER_CONFIG_VARIABLES, 'configId') as unknown as Map<UserConfigId, UserConfigInfo>;
    //console.log('infoMap:', this.infoMap);
    this.logger.log(INIT_LOG_PREFIX + this.constructor.name + ' initialized');
  }

  getAuthorizedRoles(): AuthorizedRoles {
    return 'AnyRole';
  }

  //------------------------------------- get -------------------------------------
  async getAll(user: Auth): Promise<UserConfig[]> {
    const userVars = await this.getAllAsMap(user);
    return Array.from(userVars.values());
  }

  async getString(user: Auth, configId: UserConfigId): Promise<string> {
    const cfg = await this.getVariable(user, configId);
    ConfigUtils.checkVariableType(cfg, ConfigType.String);
    return cfg.value;
  }

  async setString(user: Auth, configId: UserConfigId, value: string): Promise<void> {
    await this.setVariable(user, { configId, type: ConfigType.String, value });
  }

  async getNumber(user: Auth, configId: UserConfigId, defaultValue?: number): Promise<number> {
    const cfg = await this.getVariable(user, configId);
    ConfigUtils.checkVariableType(cfg, ConfigType.Number);
    return cfg.value;
  }

  async setNumber(user: Auth, configId: UserConfigId, value: number): Promise<void> {
    await this.setVariable(user, { configId, type: ConfigType.Number, value });
  }

  async getBoolean(user: Auth, configId: UserConfigId, defaultValue?: boolean): Promise<boolean> {
    const cfg = await this.getVariable(user, configId);
    ConfigUtils.checkVariableType(cfg, ConfigType.Boolean);
    return cfg.value;
  }

  async setBoolean(user: Auth, configId: UserConfigId, value: boolean): Promise<void> {
    await this.setVariable(user, { configId, type: ConfigType.Boolean, value });
  }

  /**
   * It gets variable from  the cache.
   * Cache initialized from the database during the startup.
   *
   * @param user
   * @param configId
   */
  async getVariable(user: Auth, configId: UserConfigId): Promise<UserConfig> {
    const userVars = await this.getAllAsMap(user);
    return userVars.get(configId);
  }

  async setVariable(user: Auth, config: UserConfig): Promise<UserConfig> {
    const { configId, type, value } = config;
    let foundInCache = await this.getVariable(user, config.configId);
    if (!foundInCache) {
      // not found in cache yet, input entry will be pushed into the cache as is
      // after validation
      ConfigUtils.checkVariable(config, this.infoMap);
      foundInCache = config;
      const userVars = await this.getAllAsMap(user); // user entries in cache
      userVars.set(config.configId, foundInCache);
    }
    await this.applyValue(user, foundInCache, config.value);

    // broadcast changes
    this.notifyDataChanged(config, user.name);
    return foundInCache;
  }

  async getInitialFeatureData(user: Auth): Promise<UserConfig[]> {
    return this.getAll(user);
  }

  //------------------------------- helpers -------------------------------
  /**
   * Getting user variables as map.
   *
   * - first it tries to get variables from the cache
   * - if cache has not been initialized yet, variables will be loaded on-demand from the database
   *
   * @param user
   * @private
   */
  private async getAllAsMap(user: Auth): Promise<Map<UserConfigId, UserConfig>> {
    let userVars = this.cache.get(user.id);
    if (!userVars) {
      const where: FilterQuery<UserCfg> = { user: { id: user.id } };
      const cfgs: UserCfg[] = await this.userCfgRepository.find(where);
      //console.log('cfgs:', cfgs);
      const configs = cfgs.map((cfg) => this.converter.fromEntity(cfg));
      //console.log('configs:', configs);
      userVars = MapUtils.arrayToMap(configs, 'configId') as unknown as Map<UserConfigId, UserConfig>;
      //console.log('userVars:', userVars);
    }
    return userVars;
  }

  /**
   * To apply change to configuration variable:
   *  - flush to database
   *  - apply to original value, too (found in cache)
   *
   * @param user owner
   * @param original config entry found in cache (or new one already pushed there)
   * @param changedValue new config value
   * @private
   */
  private async applyValue(user: Auth, original: UserConfig, changedValue: any) {
    const where: FilterQuery<UserCfg> = { user: { id: user.id }, configId: String(original.configId) };
    const dbVar = await this.userCfgRepository.findOne(where);
    if (dbVar) {
      dbVar.value = String(changedValue);
    } else {
      const cfg: EntityData<UserCfg> = {
        configId: String(original.configId),
        type: original.type,
        value: String(changedValue),
        user: this.userRepository.getReference(user.id),
      };
      await this.userCfgRepository.create(cfg);
    }
    await this.userCfgRepository.flush();
    original.value = changedValue;
  }
}
