import { CanActivate, ExecutionContext, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ClientConnectionService } from '../../client-connection/client-connection.service';
import { TraceService } from '../../core/trace/trace.service';
import { WsUnauthorizedException } from '../exception/ws-exceptions';
import { NO_AUTH_KEY } from './no-auth.decorator';
import { Reflector } from '@nestjs/core';
import { Role, RoleUtils, Trace } from '@nestjs-orm/client';
import { ROLES_KEY } from '../role/roles.decorator';

/**
 * This guard used by WebSocket gateways to authorize connection requests.
 * By default, only authenticated clients can send WebSocket messages.
 *
 * It checks if a connection associated to a socket contains a valid JWT token.
 * WebSocket protocol doesn't support authentication/authorization. Application layer should provide it.
 *
 * Solution here:
 * Client authenticates the current WebSocket connection by sending an 'auth' WebSocket message (@see: AppGateway.handleAuth())
 * right after connected. In 'auth' handler JWT token is extracted and expiration also validated.
 * This guard is called ONLY for subsequent messages.
 *
 * Token validation steps:
 *    - Is token exist, at all?
 *    - Is token valid? Maybe any problem found during the first validation in 'auth' handler.
 *    - Is the token not expired?
 *    - If roles are resticted with @Roles decorator then do the current roles contain the required role(s)?
 *
 * All connection messages are authorized, except:
 *    - connection, disconnection
 *    - 'auth' request (@see: WsEvent.Auth)
 *    - simple 'ping' (@see: WsEvent.Ping)
 *    - remove a feature (@see: WsEvent.RemoveFeature) - sometimes it received after logout
 *
 * If you don't want to authorize a message, add @NoAuth() decorator to handler method (e.g. handlePing()).
 */
@Injectable()
export class WsConnectionGuard implements CanActivate {
  private logger: Logger = new Logger(WsConnectionGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => TraceService)) private traceService: TraceService,
    @Inject(forwardRef(() => ClientConnectionService)) private connectionService: ClientConnectionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket: Socket = context.switchToWs().getClient<Socket>();
    const handler = context.getHandler();
    const data = context.switchToWs().getData();
    const client = context.switchToWs().getClient();
    if (!handler || !handler.name || handler.name === '') {
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.verbose(this.logger, Trace.Auth, `WsConnectionGuard.canActivate() -> ${context.getClass().name}.<no handler> -> ignored - client[${socket.id}]`);
      }
      //console.log('HADSHAKE:', socket.handshake);
      return true;
    }

    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, `WsConnectionGuard.canActivate() -> ${context.getClass().name}.${handler?.name} - client[${socket.id}]`);
    }
    //console.log('HADSHAKE:', socket.handshake);

    // @NoAuth
    const noAuth = this.reflector.getAllAndOverride<boolean>(NO_AUTH_KEY, [context.getHandler(), context.getClass()]);
    if (noAuth) {
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.verbose(this.logger, Trace.Auth, `@NoAuth - client[${socket.id}]`);
      }
      return true;
    }

    const conn = this.connectionService.get(socket.id);
    if (!conn) {
      const msg = `No connection found for Socket(${socket.id})`;
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.warn(this.logger, Trace.Auth, msg);
      }
      throw new WsUnauthorizedException(msg);
    }
    if (!conn.tokenInfo) {
      const msg = `No auth token found in Connection[${conn.socketId}]`;
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.warn(this.logger, Trace.Auth, msg);
      }
      throw new WsUnauthorizedException(msg);
    }

    // other reason (detected before)?
    if (!conn.tokenInfo.valid) {
      const msg = `Token is not valid in Connection[${conn.socketId}]: ${conn.tokenInfo.reason})`;
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.warn(this.logger, Trace.Auth, msg);
      }
      throw new WsUnauthorizedException(msg);
    }

    // re-check expiration for now
    const now = Math.floor(Date.now() / 1000);
    if (conn.tokenInfo.expiration < now) {
      conn.tokenInfo.valid = false;
      const msg = `Token has been expired in Socket(${socket.id} - token:${conn.tokenInfo.expiration}, now:${now})`;
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.warn(this.logger, Trace.Auth, msg);
      }
      throw new WsUnauthorizedException(msg);
    }

    // finally check if there is a role restriction
    const validRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (validRoles) {
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.verbose(this.logger, Trace.Auth, 'validRoles:', validRoles);
      }
      const validRolesBits = RoleUtils.bitsFromRoles(validRoles);
      const enabled = validRolesBits & conn.roles;
      if (!enabled) {
        const msg = `Not authorized by roles`;
        if (this.traceService.isTraceEnabled(Trace.Auth)) {
          this.traceService.warn(this.logger, Trace.Auth, msg);
        }
        throw new WsUnauthorizedException(msg);
      }
    }
    return true;
  }
}
