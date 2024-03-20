import { Controller, forwardRef, Inject, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { OverrideGlobalGuard } from './passport/override-global-guard.decorator';
import { AuthService } from './auth.service';
import { JwtStrategy } from './passport/jwt.strategy';
import { LoginResult } from './model/auth.model';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { ClientConnectionService } from '../client-connection/client-connection.service';
import { TraceService } from '../core/trace/trace.service';
import { Trace } from '@nestjs-orm/client';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private jwtStrategy: JwtStrategy,
    @Inject(forwardRef(() => ClientConnectionService)) private connectionService: ClientConnectionService,
    @Inject(forwardRef(() => TraceService)) private traceService: TraceService,
  ) {}

  /**
   * Login for JWT
   * @param req
   */
  @OverrideGlobalGuard()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: any): Promise<LoginResult> {
    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, 'AuthController.login()');
    }
    return this.jwtStrategy.createJwtForLogin(req.user);
  }
  /*
  @Post('logout')
  async logout(@Body() dto: LogoutDto, @CurrentUser() me: Auth): Promise<void> {
    if (this.traceService.traceEnabled(Trace.Auth)) {
      this.traceService.debug(this.logger, Trace.Auth, `AuthController.logout(user: ${me.name}), socketId: ${dto.socketId}`);
    }
    // refresh client monitors
    this.connectionService.logout(dto.socketId);

    // leaving user room
    this.appGateway.logout(dto.socketId, me.name);
  }
*/
  @Post('renew')
  async renew(@Req() req: any): Promise<LoginResult> {
    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, 'renew token for ' + req.user.name);
    }
    return this.jwtStrategy.createJwtForLogin(req.user);
  }
}
