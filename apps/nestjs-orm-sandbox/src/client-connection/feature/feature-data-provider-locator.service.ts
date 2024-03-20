import { forwardRef, Inject, Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { AsyncUtils, Auth, EnumUtils, Feature, Role, RoleUtils } from '@nestjs-orm/client';
import { CounterService } from './example/counter.service';
import { ClientConnectionService } from '../client-connection.service';
import { UserConfigService } from '../../core/config/user-config/user-config.service';
import { AppConfigService } from '../../core/config/app-config/app-config.service';
import { INIT_LOG_PREFIX } from '../../init/init.service';
import { WsUnauthorizedException } from '../../auth/exception/ws-exceptions';
import { FeatureDataProvider } from '../../core/features/feature-data-provider';

export type AuthorizedRoles = Role[] | 'AnyRole';

@Injectable()
export class FeatureDataProviderLocatorService {
  private readonly logger = new Logger(FeatureDataProviderLocatorService.name);
  constructor(
    @Inject(forwardRef(() => AppConfigService)) private appConfigService: AppConfigService,
    @Inject(forwardRef(() => UserConfigService)) private userConfigService: UserConfigService,
    @Inject(forwardRef(() => CounterService)) private counterService: CounterService,
    @Inject(forwardRef(() => ClientConnectionService)) private connectionService: ClientConnectionService,
  ) {}

  /**
   * It initializes all supported FeatureProvider services.
   */
  async init(): Promise<void> {
    this.logger.log(INIT_LOG_PREFIX + this.constructor.name + ' initializing...');
    const providers: FeatureDataProvider<any, any>[] = [];
    for (const key of EnumUtils.enumKeys(Feature)) {
      const feature = Feature[key];
      try {
        // AppConfigService will be initialized explicitely (at the very beginning)
        if (feature !== Feature.AppConfig) {
          providers.push(this.getProviderForFeature(feature));
        }
      } catch (err) {
        if (!(err instanceof NotImplementedException)) {
          throw err;
        }
      }
    }
    await AsyncUtils.asyncForEach(providers, async (provider) => await provider.init());
    this.logger.log(INIT_LOG_PREFIX + this.constructor.name + ' initialized');
  }

  async getInitialFeatureData(user: Auth | undefined, feature: Feature): Promise<any> {
    const provider = this.getProviderForFeature(feature);
    if (!this.checkIsProviderAuthorizedForUser(provider, user)) {
      const msg = `${user?.name} : not authorized to call FeatureProvider (${provider.constructor.name})`;
      this.logger.error(msg);
      throw new WsUnauthorizedException(msg);
    }
    const data = await provider.getInitialFeatureData(user);
    return data;
  }

  private getProviderForFeature(feature: Feature): FeatureDataProvider<any, any> {
    switch (feature) {
      case Feature.AppConfig:
        return this.appConfigService;
      case Feature.UserConfig:
        return this.userConfigService;
      case Feature.Counter:
        return this.counterService;
      case Feature.ClientMonitor:
        return this.connectionService;
      default:
        throw new NotImplementedException('FeatureProvider not provided for [' + feature + ']');
    }
  }

  private checkIsProviderAuthorizedForUser(provider: FeatureDataProvider<any, any>, user: Auth): boolean {
    const authRoles = provider.getAuthorizedRoles();
    if (authRoles === 'AnyRole') {
      return true;
    }
    if (!user) {
      return false;
    }
    return RoleUtils.rolesContainAnyOf(authRoles, user?.roles);
  }
}
