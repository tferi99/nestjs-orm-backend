import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { NO_AUTH_KEY } from './no-auth.decorator';
import { TraceService } from '../../core/trace/trace.service';
import { Trace } from '@nestjs-orm/client';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  private readonly logger = new Logger(LocalAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private traceService: TraceService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, 'LocalAuthGuard');
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(NO_AUTH_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
