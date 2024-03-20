import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role, Trace } from '@nestjs-orm/client';
import { NO_ROLE_KEY } from './no-role.decorator';
import { TraceService } from '../../core/trace/trace.service';
import { NO_AUTH_KEY } from '../passport/no-auth.decorator';

/**
 * It checks if the current user does own at least 1 role from roles
 * listed in @Roles decorator.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private traceService: TraceService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const clazz = context.getClass();
    const handler = context.getHandler();

    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, `RolesGuard.canActivate() - call: ${clazz?.name}.${handler?.name}(...)`);
    }

    // @NoAuth
    const noAuth = this.reflector.getAllAndOverride<boolean>(NO_AUTH_KEY, [handler, clazz]);
    if (noAuth) {
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.verbose(this.logger, Trace.Auth, '@NoAuth');
      }
      return true;
    }

    // @NoRole
    const noRole = this.reflector.getAllAndOverride<boolean>(NO_ROLE_KEY, [context.getHandler(), context.getClass()]);
    if (noRole) {
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.verbose(this.logger, Trace.Auth, '@NoRole added -> role protection switched OFF');
      }
      return true;
    }
    const validRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, 'validRoles:', validRoles);
    }
    if (!validRoles) {
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.verbose(this.logger, Trace.Auth, 'no roles, no protection', validRoles);
      }
      return true; // if no role specified this guard is ignored
    }
    const { user } = context.switchToHttp().getRequest();
    const enabled = validRoles.some((role) => user?.roles?.includes(role));
    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, `RolesGuard enabled=${enabled} for user:`, user);
    }
    return enabled; // at least 1 role owned by user
  }
}
