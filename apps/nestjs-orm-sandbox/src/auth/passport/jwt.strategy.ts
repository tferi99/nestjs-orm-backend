import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Auth, JwtPayload, Role, Trace } from '@nestjs-orm/client';
import { LoginResult } from '../model/auth.model';
import { TraceService } from '../../core/trace/trace.service';
import { EnvUtils } from '../../core/util/env-utils';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private jwtService: JwtService,
    private traceService: TraceService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: EnvUtils.getValue('JWT_SECRET'),
    });
  }

  // JWT payload -> request.user as Auth
  // by JWT strategy
  async validate(payload: any): Promise<Auth> {
    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, 'JwtStrategy.validate(): ' + JSON.stringify(payload));
    }

    const jwtPayload = payload as JwtPayload;
    return {
      id: Number(jwtPayload.sub),
      name: jwtPayload.username,
      roles: jwtPayload.roles,
    };
  }

  // AuthModel -> JWT payload
  /**
   * It creates a JWT token from user and returns as object with 'access_token'.
   *
   * JWT token content:
   *    - user name (username)
   *    - user ID (sub)
   *    - roles (roles)
   * @param user
   */
  async createJwtForLogin(auth: Partial<Auth>): Promise<LoginResult> {
    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, 'createJwtForlogin() from ' + JSON.stringify(auth));
    }

    const roles: Role[] = [];
    const isAdmin = auth.roles?.includes(Role.Admin);
    const isUser = auth.roles?.includes(Role.User);
    if (isAdmin) {
      roles.push(Role.Admin);
    }
    if (isUser) {
      roles.push(Role.User);
    }
    const payload: Partial<JwtPayload> = { username: auth.name, sub: auth.id?.toString(), roles };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
