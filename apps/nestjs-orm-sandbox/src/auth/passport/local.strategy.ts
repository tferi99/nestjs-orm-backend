import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Auth, Trace } from '@nestjs-orm/client';
import { TraceService } from '../../core/trace/trace.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(
    private authService: AuthService,
    private traceService: TraceService,
  ) {
    super({
      passReqToCallback: true,
    });
  }

  async validate(req: Request, username: string, password: string): Promise<Auth> {
    const socketId = req.body ? req.body['socketId'] : undefined;

    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, `LocalStrategy.validate() user: ${username}, socketId: ${socketId}`);
    }
    const auth = await this.authService.validateUser(username, password);
    if (!auth) {
      throw new UnauthorizedException();
    }
    return auth;
  }
}
