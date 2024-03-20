import { Controller, Get } from '@nestjs/common';
import { ClientConnectionService } from './client-connection.service';
import { ClientConnectionDto, FeatureConfig, FeatureUtils, Role } from '@nestjs-orm/client';
import { Roles } from '../auth/role/roles.decorator';
import { ClientConnection } from './client-connection.model';
import { EnvUtils } from '../core/util/env-utils';
import { ClientConnectionUtils } from './client-connection-utils';

@Controller('client')
export class ClientConnectionController {
  constructor(private connectionService: ClientConnectionService) {}

  @Get()
  @Roles(Role.Admin)
  getAll(): ClientConnectionDto[] {
    const conns = this.connectionService.getAll();
    return Array.from(conns.values()).map((conn) => ClientConnectionUtils.convertSensitiveData(conn));
  }

  @Get('/dev')
  @Roles(Role.Admin)
  getAllDev(): ClientConnection[] {
    const isDev = EnvUtils.isDevelopment();
    if (!isDev) {
      throw new Error('Not supported');
    }
    const conns = this.connectionService.getAll();
    return Array.from(conns.values());
  }

  @Get('/activeFeatures')
  getActiveFeatures(): number {
    return this.connectionService.activeFeatures;
  }

  @Get('/activeFeatureConfigs')
  getActiveFeatureConfigs(): FeatureConfig[] {
    return FeatureUtils.featureBitsToFeatureConfigs(this.connectionService.activeFeatures);
  }
}
