import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException, WsResponse } from '@nestjs/websockets';
import { forwardRef, Inject, Logger, UseFilters, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ClientConnectionService } from './client-connection.service';
import { GlobalWsExceptionsFilter } from '../core/filter/global-ws-exception.filter';
import { FeatureDataProviderLocatorService } from './feature/feature-data-provider-locator.service';
import { TraceService } from '../core/trace/trace.service';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { WsConnectionGuard } from '../auth/passport/ws-connection.guard';
import { NoAuth } from '../auth/passport/no-auth.decorator';
import { Roles } from '../auth/role/roles.decorator';
import { WsUnauthorizedException } from '../auth/exception/ws-exceptions';
import { AppConfigService } from '../core/config/app-config/app-config.service';
import { ClientConnection } from './client-connection.model';
import { INIT_LOG_PREFIX } from '../init/init.service';
import { ClientConnectionUtils, DataBroadcastTarget } from './client-connection-utils';
import { AppConfigId, AuthForServer, AuthReason, Feature, FeatureUtils, Role, Trace, WsEvent } from '@nestjs-orm/client';

@WebSocketGateway({
  cors: true,
  //  cors: { origin: 'https://hoppscotch2.io' },
  //  cors: { origin: 'http://localhost:4220' },
})
@UseFilters(new GlobalWsExceptionsFilter())
@UseGuards(WsConnectionGuard)
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer() wsServer: Server;

  constructor(
    private orm: MikroORM,
    private featureLocatorService: FeatureDataProviderLocatorService,
    @Inject(forwardRef(() => ClientConnectionService)) private clientConnectionService: ClientConnectionService,
    @Inject(forwardRef(() => TraceService)) private traceService: TraceService,
    @Inject(forwardRef(() => AppConfigService)) private appConfigService: AppConfigService,
  ) {}

  afterInit(server: Server): any {
    this.logger.log(INIT_LOG_PREFIX + 'WebSocket gateway initialized');
  }

  /**
   * Called by NestJS WebSocketGateway framework on socket connection.
   *
   * VERY IMPORTANT TO HANDLE ERRORS HERE!!!
   * Otherwise application may crash.
   *
   * SEE ALSO:  https://github.com/nestjs/nest/issues/2028
   */
  handleConnection(socket: Socket, ...args: any[]): void {
    try {
      if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
        this.traceService.verbose(this.logger, Trace.WebSocket, `WS client[${socket.id}] connected from ${socket.handshake.address}`);
        this.traceService.verbose(this.logger, Trace.WebSocket, 'HEADER[host]: ' + socket.request.headers['host']);
        this.traceService.verbose(this.logger, Trace.WebSocket, 'HEADER[user-agent]: ' + socket.request.headers['user-agent']);
      }

      //console.log('Request headers:', socket.request.headers);
      const clientIp: string = socket.handshake.address;
      const someHeaders: { [key: string]: string | undefined } = {
        host: socket.request.headers['host'],
        userAgent: socket.request.headers['user-agent'],
      };
      this.clientConnectionService.add(socket.id, clientIp, someHeaders);
      socket.emit(WsEvent.Connected, socket.id);
    } catch (err: any) {
      const msg = `Error occured in handleConnection(client[${socket.id}])`;
      this.logger.error(msg, err);
      const errMsg = err instanceof Error ? err.message : '?';
      this.disconnect(socket, msg + ' : ' + errMsg);
    }
  }

  /**
   * Called by NestJS WebSocketGateway framework on socket disconnection.
   *
   * @param socket
   */
  handleDisconnect(socket: Socket): void {
    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `WS client[${socket.id}] disconnected`);
    }
    this.clientConnectionService.remove(socket.id);
  }

  @SubscribeMessage(WsEvent.Ping)
  @NoAuth()
  handlePing(socket: Socket, payload: any): WsResponse<string> {
    this.traceWsReceive(WsEvent.Ping, socket, payload);
    this.traceWsSend(WsEvent.Pong, socket, payload);
    return { event: WsEvent.Pong, data: payload };
  }

  @SubscribeMessage(WsEvent.PingWithAuth)
  handlePingWithAuth(socket: Socket, payload: any): WsResponse<string> {
    this.traceWsReceive(WsEvent.PingWithAuth, socket, payload);
    this.traceWsSend(WsEvent.Pong, socket, payload);
    return { event: WsEvent.Pong, data: payload };
  }

  @Roles(Role.Admin)
  @SubscribeMessage(WsEvent.PingAdminOnly)
  handlePingAdminOnly(socket: Socket, payload: any): WsResponse<string> {
    this.traceWsReceive(WsEvent.PingAdminOnly, socket, payload);
    this.traceWsSend(WsEvent.Pong, socket, payload);
    return { event: WsEvent.Pong, data: payload };
  }

  /**
   * It assigns authorization information from a connection to it's connection
   * to authorize subsequent WS messages.
   *
   * This request also used to subscribe connection to connection-specific push messages
   * by joining user to room[auth.name].
   *
   * @param socket
   * @param authForServer
   */
  @SubscribeMessage(WsEvent.Auth)
  // WARNING!!! @NoAuth() not required here, @UseRequestContext changes metadata behavior
  @UseRequestContext()
  async handleAuth(socket: Socket, authForServer: AuthForServer): Promise<WsResponse<AuthReason> | undefined> {
    this.traceWsReceive(WsEvent.Auth, socket, authForServer);

    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `Auth[${authForServer.token}, ${authForServer.reason}] associating to client[${socket.id}]`);
    }
    if (!authForServer.token) {
      if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
        this.traceService.verbose(this.logger, Trace.WebSocket, `Auth without token -> client[${socket.id}] not authorized.`);
      }
      return; // no case, just for sure if client sends 'auth' without a token
    }
    const auth = await this.clientConnectionService.validateAuthAndApplyToConnection(socket.id, authForServer.token);
    if (auth) {
      const userTarget: DataBroadcastTarget = {
        user: auth.name,
      };
      const userRoom = ClientConnectionUtils.calculateRoomIdForDataDistribution(userTarget);
      socket.join(userRoom); // join to room for user specific pushed messages
      if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
        this.traceService.verbose(this.logger, Trace.WebSocket, `Client[${socket.id}] joined to user Room[${userRoom}]`);
      }
      this.traceWsSend(WsEvent.Authorized, socket, authForServer.reason);
      return { event: WsEvent.Authorized, data: authForServer.reason };
    } else {
      this.traceWsSend(WsEvent.AuthError, socket);
      return { event: WsEvent.AuthError, data: authForServer.reason };
    }
  }

  @SubscribeMessage(WsEvent.Logout)
  async handleLogout(socket: Socket): Promise<void> {
    this.traceWsReceive(WsEvent.Logout, socket);
    this.clientConnectionService.logout(socket.id);
  }

  /**
   * It subscribes the current connection to a feature
   * by joining to a room[featureId] or room[featureId@user] SocketIO room (global or user level room for a feature).
   *
   * @param socket
   * @param featureId
   *
   * It returns feature data to client via WebSocket.
   */
  @SubscribeMessage(WsEvent.AddFeature)
  @UseRequestContext()
  async handleAddFeature(socket: Socket, feature: Feature): Promise<WsResponse<any>> {
    this.traceWsReceive(WsEvent.AddFeature, socket, feature);
    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `Feature[${feature}] adding to client[${socket.id}]`);
    }

    const conn = this.clientConnectionService.get(socket.id);
    if (!conn) {
      this.logger.error(`Connection not found for client[${socket.id}] to add FEATURE[${feature}]`);
      return { event: FeatureUtils.createFeatureWsEventId(feature, WsEvent.FeatureNotAdded), data: `No connection found for adding Feature[${feature}]` };
    }
    this.checkFeatureInitialDataAuthorization(feature, conn, socket.id);

    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `    Feature[${feature}] adding to client[${socket.id}] user[${conn.auth?.name}]`);
    }

    const featureRoom = ClientConnectionUtils.calculateRoomIdForDataDistribution({ feature, user: conn.auth?.name });
    if (featureRoom) {
      socket.join(featureRoom);
    }
    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `Client[${socket.id}] joined to feature Room[${featureRoom}]`);
    }
    this.clientConnectionService.addFeature(socket.id, feature);
    const data = await this.featureLocatorService.getInitialFeatureData(conn.auth, feature);
    const initialDataResponse: WsResponse<any> = { event: FeatureUtils.createFeatureWsEventId(feature, WsEvent.FeatureAdded), data };
    this.traceWsSend(initialDataResponse.event as WsEvent, socket, initialDataResponse);
    return initialDataResponse;
  }

  @SubscribeMessage(WsEvent.RemoveFeature)
  @NoAuth()
  async handleRemoveFeature(socket: Socket, feature: Feature): Promise<void> {
    this.traceWsReceive(WsEvent.RemoveFeature, socket, feature);

    const conn = this.clientConnectionService.get(socket.id);
    if (!conn) {
      this.logger.warn(`Connection not found for client[${socket.id}] to remove FEATURE[${feature}]`);
      return;
    }
    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `FEATURE[${feature}] removing from client[${socket.id}]`);
    }

    const featureRoom = ClientConnectionUtils.calculateRoomIdForDataDistribution({ feature, user: conn.auth?.name });
    socket.leave(featureRoom);
    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `Client[${socket.id}] left feature Room[${featureRoom}]`);
    }
    this.clientConnectionService.removeFeature(socket.id, feature);
  }

  @SubscribeMessage(WsEvent.GenerateWsError)
  @NoAuth()
  handleGenerateWsError(socket: Socket, payload: any): WsResponse<any> {
    this.traceWsReceive(WsEvent.GenerateWsError, socket, payload);
    const num = Math.floor(Math.random() * 100);
    throw new WsException('Generated test error: ' + num);
  }

  @SubscribeMessage(WsEvent.GenerateError)
  @NoAuth()
  handleGenerateError(socket: Socket, payload: any): void {
    this.traceWsReceive(WsEvent.GenerateError, socket, payload);
    // it generates an exception
    this.appConfigService.getBoolean(AppConfigId.DummyForError);
  }

  // -------------------------------- broadcast --------------------------------
  /**
   * To broadcast SocketIO messages to clients.
   * You can send global messages for a room.
   *
   * NOTE:
   *    Don't call this message broadcasting method directly.
   *    {@link ClientConnectionService} wraps this method and adds some
   * @param eventId
   * @param data
   * @param room
   */
  broadcast(eventId: string, data: any, room?: string) {
    if (room) {
      this.broadcastToRoom(eventId, data, room);
    } else {
      this.broadcastToAll(eventId, data);
    }
  }

  private broadcastToAll(eventId: string, data: any) {
    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `Broadcast[${eventId}]`, data);
    }
    this.wsServer.emit(eventId, data);
  }

  private broadcastToRoom(eventId: string, data: any, room: string) {
    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `Broadcast[${eventId}] to room[${room}]`, data);
    }
    this.wsServer.to(room).emit(eventId, data);
  }

  disconnect(socket: Socket, reason: string) {
    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `Disconnecting client[${socket.id}] - reason:${reason}`);
    }
    socket.emit(WsEvent.Error, 'Disconnected. Reason:' + reason);
    socket.disconnect();
  }

  logout(socketId: string, user: string) {
    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `Logout client[${socketId}] => leaving room[${user}]`);
    }
    const socket = this.wsServer.sockets.sockets.get(socketId);
    if (socket) {
      const room = user;
      socket.leave(room);
      if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
        this.traceService.verbose(this.logger, Trace.WebSocket, `Client[${socket.id}] left user Room[${room}]`);
      }
    } else {
      if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
        this.traceService.warn(this.logger, Trace.WebSocket, `Logout cancelled, client[${socketId}] not found`);
      }
    }
  }

  //----------------------------------------------- helpers -----------------------------------------------
  private traceWsReceive(ev: WsEvent, socket: Socket, payload?: any) {
    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `<<<<<<<<<< [${ev}] client[${socket.id}]`, payload);
    }
  }

  private traceWsSend(ev: WsEvent, socket: Socket, payload?: any) {
    if (this.traceService.isTraceEnabled(Trace.WebSocket)) {
      this.traceService.verbose(this.logger, Trace.WebSocket, `>>>>>>>>>> [${ev}] client[${socket.id}]`, payload);
    }
  }

  /**
   * It checks if initial data can be sent to the current user.
   * Authorization based on roles of the current user retrieved from the connection.
   * If at least one role of the user contained by feature roles then user is
   * authorized for the feature data.
   *
   * No authorization is required for these features:
   *    {@link Feature.AppConfig}
   *
   * Return:
   *  true:   if found connection and authorized
   *  false:  if connection not found (authorization not checked)
   *
   * It throws WsUnauthorizedException if not authorized.
   *
   * @param feature
   * @param conn
   * @param socketId for tracing
   * @private
   */
  private checkFeatureInitialDataAuthorization(feature: Feature, conn: ClientConnection, socketId: string) {
    if (!conn) {
      this.logger.warn(`${socketId} : connection not found to add feature: ${feature} for client[${socketId}]`);
      return false;
    }

    // no auth required for these feature-modules
    if (feature === Feature.AppConfig) {
      return true;
    }

    // feature authorization
    const initialDataRoles: Role[] = FeatureUtils.getFeatureConfigByFeature(feature).initialDataRoles; // roles for feature
    let foundRoles: Role[];
    if (initialDataRoles) {
      if (!conn.auth) {
        this.logger.warn(`${socketId} : Auth not found in connection to add feature: ${feature} for client[${socketId}]`);
        return false;
      }
      foundRoles = initialDataRoles.filter(
        (initialDataRole) =>
          initialDataRole === Role.All ||
          conn.auth?.roles.some((authRole) => {
            // console.log(`authRole: ${authRole} roleFromConn:${roleFromConn}`);
            return authRole === initialDataRole;
          }),
      );
    } else {
      throw new WsUnauthorizedException(`No role authorization found for Feature[${feature}] and client[${socketId}]`);
    }
    if (!foundRoles?.length) {
      throw new WsUnauthorizedException(`Feature[${feature}] not authorized to '${conn.auth.name}' for client[${socketId}]`);
    }
    return true;
  }
}
