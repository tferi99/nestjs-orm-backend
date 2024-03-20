import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../core/orm/entity/user.entity';
import { EventsApiService } from '../core/events/events-api/events-api.service';
import { UserRepository } from '../feature-modules/admin/user/user.repository';
import { EntityManager, MikroORM, UseRequestContext } from '@mikro-orm/core';
import { AppEvent, ConfigType, DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME, DEFAULT_USER_PASSWORD, DEFAULT_USER_USERNAME, UserConfigId } from '@nestjs-orm/client';
import { UserCfg } from '../core/config/user-config/user-cfg.entity';
import { UserCfgRepository } from '../core/config/user-config/user-cfg.repository';
import { EnvUtils } from '../core/util/env-utils';
import { AppConfigService } from '../core/config/app-config/app-config.service';
import { TraceService } from '../core/trace/trace.service';
import { TaskExecutorService } from '../task-executor/task-executor.service';
import { FeatureDataProviderLocatorService } from '../client-connection/feature/feature-data-provider-locator.service';

export const INIT_LOG_PREFIX = '##### INIT: ';

/**
 * Initialization crud. It started as a task during startup.
 * If initialization completed it emits event.
 *
 * In MikroORM v5, it is no longer possible to use the global identity map.
 * You need to fork it before using from a global crud or use @UseRequestContext().
 */
@Injectable()
export class InitService {
  private readonly logger = new Logger(InitService.name);

  private serviceTestCounter = 0;

  constructor(
    private orm: MikroORM, // for @UseRequestContext()
    private em: EntityManager,
    private userRepository: UserRepository,
    private userCfgRepository: UserCfgRepository,
    private eventsApiService: EventsApiService,
    private taskExecutorService: TaskExecutorService,
    @Inject(forwardRef(() => AppConfigService)) private appConfigService: AppConfigService,
    @Inject(forwardRef(() => TraceService)) private traceService: TraceService,
    @Inject(forwardRef(() => FeatureDataProviderLocatorService)) private featureProviderLocatorService: FeatureDataProviderLocatorService,
  ) {}

  @UseRequestContext()
  async initApplication() {
    this.logger.log('*****************************************************************************************');
    this.logger.log('****************************** Application initialization *******************************');
    this.logger.log('*****************************************************************************************');

    if (EnvUtils.isTesting()) {
      this.logger.log('Application initialization for testing...');
    } else {
      // initial database content
      await this.initDbContent();

      // THIS SHOULD BE THE FIRST ONE!!!
      await this.appConfigService.init();
      await this.traceService.init();

      // feature services
      await this.featureProviderLocatorService.init();

      // other services
      //await this.taskExecutorService.init(TASK_EXECUTOR_CONFIG);

      this.eventsApiService.emit({ id: AppEvent.AppInited });
      this.logger.log('-------------- Application initialized --------------');
    }
  }

  /**
   * It creates 2 default users if no user created yet.
   */
  async initDbContent() {
    this.logger.log(INIT_LOG_PREFIX + 'DB content intializing...');

    const isDev = EnvUtils.isDevelopment();
    const users = await this.userRepository.findAll();
    this.logger.log('Number of users in database: ' + users.length);
    if (users.length > 0) {
      return; // inited
    }

    let createdAdmin: User;
    let createdUser: User;
    let createdGod: User;
    await this.em.transactional(async (em) => {
      //---------------------------- User ----------------------------
      const god: Partial<User> = {
        name: 'god',
        password: 'god',
        admin: true,
        user: true,
      };
      createdGod = await this.userRepository.insert(god);

      const admin: Partial<User> = {
        name: DEFAULT_ADMIN_USERNAME,
        password: DEFAULT_ADMIN_PASSWORD,
        admin: true,
        user: false,
      };
      createdAdmin = await this.userRepository.insert(admin);

      const user: Partial<User> = {
        name: DEFAULT_USER_USERNAME,
        password: DEFAULT_USER_PASSWORD,
        admin: false,
        user: true,
      };
      createdUser = await this.userRepository.insert(user);
    });

    await this.em.transactional(async (em) => {
      //---------------------------- UserConfig ----------------------------
      const userConfig0: Partial<UserCfg> = {
        configId: UserConfigId.TestStringForAdmin,
        type: ConfigType.String,
        value: 'test_for_admin',
        user: createdAdmin,
      };
      await this.userCfgRepository.insert(userConfig0);

      const userConfig1: Partial<UserCfg> = {
        configId: UserConfigId.TestStringForUser,
        type: ConfigType.String,
        value: 'test_for_user',
        user: createdUser,
      };
      await this.userCfgRepository.insert(userConfig1);

      const userConfig2: Partial<UserCfg> = {
        configId: UserConfigId.TestNumberForUser,
        type: ConfigType.Number,
        value: '134',
        user: createdUser,
      };
      await this.userCfgRepository.insert(userConfig2);

      const userConfig3: Partial<UserCfg> = {
        configId: UserConfigId.TestArrayForUser,
        type: ConfigType.Array,
        value: JSON.stringify(['cica', 'kutya', 'malac']),
        user: createdUser,
      };
      await this.userCfgRepository.insert(userConfig3);

      const userConfig4: Partial<UserCfg> = {
        configId: UserConfigId.TestObjectForUser,
        type: ConfigType.Object,
        value: JSON.stringify({
          settings: {
            category: 'market',
            threshold1: 1.345,
            now: Date.now(),
          },
        }),
        user: createdUser,
      };
      await this.userCfgRepository.insert(userConfig4);

      const userConfig5: Partial<UserCfg> = {
        configId: UserConfigId.TestStringForGod,
        type: ConfigType.String,
        value: 'test_for_god',
        user: createdGod,
      };
      await this.userCfgRepository.insert(userConfig5);
    });

    this.logger.log(INIT_LOG_PREFIX + 'DB content intialized');
  }
}
