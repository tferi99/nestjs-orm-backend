import { Body, Controller, forwardRef, Get, Inject, Logger, Param, Put, Req } from '@nestjs/common';
import { CrudOperationControl } from '../../orm/controller/crud-operation-guard/crud-operation-control.decorator';
import { Auth, Trace, UserConfig, UserConfigId } from '@nestjs-orm/client';
import { UserCfgConverter } from './user-cfg-converter';
import { Request } from 'express';
import { CurrentUser } from '../../../auth/current-user.decorator';
import { UserConfigService } from './user-config.service';
import { TraceService } from '../../trace/trace.service';

@Controller('userconfig')
@CrudOperationControl({
  getAll: true,
})
export class UserConfigController {
  private readonly logger = new Logger(UserConfigController.name);
  private converter = new UserCfgConverter();

  constructor(
    private userConfigService: UserConfigService,
    @Inject(forwardRef(() => TraceService)) private traceService: TraceService,
  ) {}

  @Get()
  async getAllUserConfigs(@Req() req: Request, @CurrentUser() me: Auth): Promise<UserConfig[]> {
    return this.userConfigService.getAll(me);
  }

  @Get('/:configId')
  async getUserConfig(@Req() req: Request, @CurrentUser() me: Auth, @Param('configId') configId: UserConfigId): Promise<UserConfig> {
    return this.userConfigService.getVariable(me, configId);
  }

  @Put('/:configId')
  async setUserConfig(@Req() req: Request, @CurrentUser() me: Auth, @Param('configId') configId: UserConfigId, @Body() cfg: UserConfig): Promise<UserConfig> {
    cfg.configId = configId;
    if (this.traceService.isTraceEnabled(Trace.UserConfig)) {
      this.traceService.verbose(this.logger, Trace.UserConfig, `Set User[${me.name}] config[${configId}]`, cfg);
    }
    return this.userConfigService.setVariable(me, cfg);
  }

  /*  @Put(':id')
  async updateConfig(@Req() req: Request, @CurrentUser() me: Auth, @Param('id') id: string, @Body() data: UserConfig): Promise<number> {
    const cfg: EntityData<UserCfg> = {
      value: data.value,
    };
    const options: UpdateOptions<UserCfg> = <UpdateOptions<UserCfg>>this.optionsForCurrentUser(me, {});
    const updated = await this.repo.crud.nativeUpdate({ configId: data.configId }, cfg, options);
    if (updated) {
      this.clientConnectionService.broadcast({ feature: Feature.UserConfig, user: me.name }, WsEvent.UserConfigChanged, data);
    }
    return updated;
  }*/
}
