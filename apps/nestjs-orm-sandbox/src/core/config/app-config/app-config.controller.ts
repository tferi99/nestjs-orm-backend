import { Body, Controller, forwardRef, Get, Inject, Logger, Param, Post, Put } from '@nestjs/common';
import { Roles } from '../../../auth/role/roles.decorator';
import { AppConfigService } from './app-config.service';
import { AppConfig, AppConfigId, Role, Trace } from '@nestjs-orm/client';
import { TraceService } from '../../trace/trace.service';

/**
 * For AppConfig management by admins.
 *
 * Use PUT requests to change existing variables or create optional variables.
 */
@Controller('appconfig')
@Roles(Role.Admin)
export class AppConfigController {
  private readonly logger = new Logger(AppConfigController.name);

  constructor(
    private appConfigService: AppConfigService,
    @Inject(forwardRef(() => TraceService)) private traceService: TraceService,
  ) {}

  @Get()
  async getAll(): Promise<AppConfig[]> {
    return this.appConfigService.getAll();
  }

  @Get('/:configId')
  getByConfigId(@Param('configId') configId: string): AppConfig {
    return this.appConfigService.getVariable(configId as AppConfigId);
  }

  @Get('/name/:name')
  async getByName(@Param('name') name: string): Promise<AppConfig[]> {
    if (!name || name.trim() === '') {
      return [];
    }
    const all = await this.appConfigService.getAll();
    return all.filter((cfg) => String(cfg.configId).toLowerCase().includes(name.toLowerCase()));
  }

  @Post()
  async init(): Promise<void> {
    this.appConfigService.init();
  }

  @Put('/:configId')
  async update(@Param('configId') configId: AppConfigId, @Body() cfg: AppConfig): Promise<AppConfig> {
    cfg.configId = configId;
    if (this.traceService.isTraceEnabled(Trace.AppConfig)) {
      this.traceService.verbose(this.logger, Trace.AppConfig, `Set application config[${configId}]`, cfg);
    }
    return this.appConfigService.setVariable(cfg);
  }
}
