import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NO_AUTH_KEY } from './no-auth.decorator';
import { Reflector } from '@nestjs/core';
import { OVERRIDE_GLOBAL_GUARD_KEY } from './override-global-guard.decorator';
import { TraceService } from '../../core/trace/trace.service';
import { Trace } from '@nestjs-orm/client';

/**
 * It calls JwtStrategy for auth.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private traceService: TraceService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const clazz = context.getClass();
    const handler = context.getHandler();
    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, `JwtAuthGuard.canActivate() - class: ${clazz.name}, handler: ${handler.name}`);
    }

    // @NoAuth
    const noAuth = this.reflector.getAllAndOverride<boolean>(NO_AUTH_KEY, [handler, clazz]);
    if (noAuth) {
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.verbose(this.logger, Trace.Auth, '@NoAuth');
      }
      return true;
    }

    // @OverrideGlobalGuard
    const isOverrideGlobalGuard = this.reflector.getAllAndOverride<boolean>(OVERRIDE_GLOBAL_GUARD_KEY, [context.getHandler(), context.getClass()]);
    if (isOverrideGlobalGuard) {
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.verbose(this.logger, Trace.Auth, '@OverrideGlobalGuard');
      }
      return true;
    }

    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  /*  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }*/
}
