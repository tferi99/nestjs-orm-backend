import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Auth, Feature, FeatureBit, FeatureUtils, JwtPayload, MapUtils, RoleBit, RoleUtils, Trace, WsEvent } from '@nestjs-orm/client';
import { AuthorizedRoles } from './feature/feature-data-provider-locator.service';
import { AppGateway } from './app.gateway';
import { ConnectionNotFoundException } from './exception/websocket-exceptions';
import { JwtService } from '@nestjs/jwt';
import { TraceService } from '../core/trace/trace.service';
import { AuthService } from '../auth/auth.service';
import { ClientConnection } from './client-connection.model';
import { ClientConnectionUtils, DataBroadcastTarget } from './client-connection-utils';
import { INIT_LOG_PREFIX } from '../init/init.service';
import { FeatureDataProviderBase } from '../core/features/feature-data-provider';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClientConnectionService extends FeatureDataProviderBase<ClientConnection, string> {
  private readonly logger = new Logger(ClientConnectionService.name);
  objectId: string;

  // Collector for all feature-modules from all connection.
  // It provides an aggregate of all active fatures in the system for optimization of broadcast.
  private _activeFeatures: number = FeatureBit.None;

  // WebSocket connections by socket ID
  private connections: Map<string, ClientConnection> = new Map<string, ClientConnection>();

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => AppGateway)) private appGateway: AppGateway,
    @Inject(forwardRef(() => TraceService)) private traceService: TraceService,
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
  ) {
    // clientConnectionService of this crud has been set directly because 'this' cannot be passed into super()
    super(Feature.ClientMonitor, undefined); // super cannot be called with 'this' parameter
    this.clientConnectionService = this; // THIS IS THE ONLY VALID DIRECT ACCESS, BECAUSE CONSTRUCTOR CANNOT BE USED

    this.objectId = uuidv4();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async init(): Promise<void> {
    this.logger.log(INIT_LOG_PREFIX + this.constructor.name + ' initializing...');
    this.logger.log(INIT_LOG_PREFIX + this.constructor.name + ' initialized');
  }

  public getActiveFeatures(reason: string): number {
    this.logger.warn('################################[' + this.objectId + '] (' + reason + ') GET activeFeatures: ' + this._activeFeatures);
    return this._activeFeatures;
  }

  /*
public get activeFeatures(): number {
    this.logger.warn('################################[' + this.objectId + '] GET activeFeatures: ' + this._activeFeatures);
    return this._activeFeatures;
  }
  */

  public set activeFeatures(value: number) {
    this._activeFeatures = value;
    this.logger.warn('################################[' + this.objectId + '] SET activeFeatures(): ' + this._activeFeatures);
  }

  getAll(): Map<string, ClientConnection> {
    return this.connections;
  }

  getAllByUserName(userName: string): Map<string, ClientConnection> {
    return MapUtils.filter(this.connections, (key, value) => value.auth?.name === userName);
  }

  get(socketId: string): ClientConnection {
    return this.connections.get(socketId);
  }

  /**
   * New SocketIO connection has been added because new client application activated on in a browser tab.
   *
   * @param socketId
   * @param clientIp
   * @param requestHeaders
   */
  add(socketId: string, clientIp: string, requestHeaders: { [key: string]: string | undefined }) {
    if (this.traceService.isTraceEnabled(Trace.ClientConnections)) {
      this.traceService.verbose(this.logger, Trace.ClientConnections, `ClientConnectionService.add(${socketId})`);
    }

    // initial connection
    const conn: ClientConnection = {
      socketId,
      clientIp,
      activeFeatures: FeatureBit.None,
      roles: RoleBit.None,
      requestHeaders,
    };
    this.connections.set(socketId, conn);
    this.notifyDataAdded(ClientConnectionUtils.convertSensitiveData(conn));
  }

  /**
   * Browser(tab) closed and SocketIO connection has been removed.
   *
   * @param socketId
   */
  remove(socketId: string) {
    if (this.traceService.isTraceEnabled(Trace.ClientConnections)) {
      this.traceService.verbose(this.logger, Trace.ClientConnections, `ClientConnectionService.remove(${socketId})`);
    }

    this.connections.delete(socketId);
    this.calculateActiveFeatures(); // re-calculate features bit-value for remaining connections
    this.notifyDataRemoved(socketId);
  }

  /**
   * It validates JWT token sent by client to authenticate a WebSocket connection.
   * If token is valid, authentication information is applied to WebSocket connection.
   *
   * @param socketId
   * @param token
   */
  async validateAuthAndApplyToConnection(socketId: string, token: string): Promise<Auth> {
    const shortToken = token && token.length > 10 ? token.substring(0, 9) + '...' : token;
    if (this.traceService.isTraceEnabled(Trace.ClientConnections)) {
      this.traceService.verbose(this.logger, Trace.ClientConnections, `Applying token[${shortToken}] to socket[${socketId}]`);
    }

    const conn = this.connections.get(socketId);
    if (!conn) {
      throw new ConnectionNotFoundException(`Connection not found for socket[${socketId}] for token ` + shortToken);
    }

    // default auth
    conn.tokenInfo = {
      token,
      valid: false,
      expiration: 0,
    };

    // validate token and retrieve fields
    try {
      const decoded: JwtPayload = this.jwtService.verify(token);
      conn.tokenInfo = {
        token,
        valid: true,
        expiration: decoded.exp,
      };

      // token is valid, validate also user
      conn.auth = await this.authService.validateUser(decoded.username);

      // calculate role bits
      if (conn.auth) {
        conn.roles = RoleUtils.bitsFromRoles(conn.auth.roles);
      }
    } catch (err: any) {
      // if token is not valid then just get field without validation
      const reason = err instanceof Error ? `Error during decoding token in Auth message handler: ${err.message}` : 'Unknown error during decoding token in Auth message handler';
      this.logger.error(`${reason} - token: ${token}`);

      // try to decode without exception
      let expiration = 0;
      const decoded: JwtPayload = this.jwtService.decode(token) as JwtPayload;
      if (decoded) {
        expiration = decoded.exp;
      } else {
        this.logger.warn(token + ': token cannot be decoded');
      }
      conn.tokenInfo = {
        token,
        valid: false,
        expiration,
        reason,
      };
      conn.auth = null;
    }
    this.notifyDataChanged(ClientConnectionUtils.convertSensitiveData(conn));
    return conn.auth;
  }

  /**
   * It merges current features from connection to service-level feature collector.
   *
   * @param socketId
   * @param feature
   */
  addFeature(socketId: string, feature: Feature) {
    const conn: ClientConnection = this.get(socketId);
    if (!conn) {
      return; // no connection found;
    }
    //conn.activeFeatures |= FeatureUtils.featureToBitValue(feature);
    conn.activeFeatures = FeatureUtils.addFeatureToBitValues(conn.activeFeatures, feature);
    this.activeFeatures |= conn.activeFeatures;
    this.logger.warn('################################[' + this.objectId + '] addFeature(): ' + this.activeFeatures);
    this.notifyDataChanged(ClientConnectionUtils.convertSensitiveData(conn));
  }

  removeFeature(socketId: string, feature: Feature) {
    const conn = this.get(socketId);
    if (!conn) {
      return; // no connection found;
    }
    conn.activeFeatures = FeatureUtils.removeFeatureFromBitValues(conn.activeFeatures, feature);
    this.calculateActiveFeatures(); // maybe other connections still have this feature
    this.notifyDataChanged(ClientConnectionUtils.convertSensitiveData(conn));
  }

  async getInitialFeatureData(user: Auth): Promise<ClientConnection[]> {
    const conns = this.getAll();
    return Array.from(conns.values()).map((conn) => ClientConnectionUtils.convertSensitiveData(conn));
  }

  /**
   * User has been logged out
   *
   * @param socketId
   */
  logout(socketId: string) {
    const conn = this.get(socketId);
    if (conn) {
      // clear auth, feature-modules and roles
      conn.auth = null; // to delete nested 'auth' on the client side
      conn.tokenInfo = undefined;
      conn.activeFeatures = FeatureBit.AppConfig; // added on connection, don't remove here
      conn.roles = RoleBit.None;

      this.calculateActiveFeatures();

      // refresh client monitors
      this.notifyDataChanged(ClientConnectionUtils.convertSensitiveData(conn));
    } else {
      this.logger.warn(socketId + ' : connection not found for Logout');
    }
  }

  /**
   * Broadcast data to feature consumers who subscribed to a feature.
   *
   *
   * Broadcast room calculated from PushedDataDistribution of the feature:
   *  - {@link PushedDataDistribution.Global}: event will be broadcast to all feature subscribers (room: feature@)
   *  - {@link PushedDataDistribution.ForFeatureOwner}: event will be broadcast to feature subscribers who owns the data (room: feature@user)
   *  - {@link PushedDataDistribution.ForUser}: event will be broadcast to a specific user (room: @user)
   *
   * @param feature target feature
   * @param event ID of broadcasted message
   * @param data broadcasted payload
   */
  broadcast(target: DataBroadcastTarget, event: WsEvent, data: any) {
    const broadcastRoom = ClientConnectionUtils.calculateRoomIdForDataDistribution(target);
    const eventId = FeatureUtils.createFeatureWsEventId(target.feature, event);

    if (this.traceService.isTraceEnabled(Trace.Broadcast)) {
      this.traceService.verbose(this.logger, Trace.Broadcast, `Broadcast[${eventId}] to Room[${broadcastRoom}]`, data);
      this.traceService.verbose(this.logger, Trace.Broadcast, '    Active feature-modules: ' + FeatureUtils.featureBitsToString(this.activeFeatures) + ' (' + this.activeFeatures + ')');
    }
    this.logger.warn(`activeFeatures: ${this.activeFeatures} ? feature: ${target.feature}`);
    if (!FeatureUtils.isFeatureExistInBitValues(this.activeFeatures, target.feature)) {
      if (this.traceService.isTraceEnabled(Trace.Broadcast)) {
        this.traceService.verbose(this.logger, Trace.Broadcast, `    Feature[${target.feature}] not subscribed -> Event[${eventId}] not broadcasted`);
      }
      return;
    }
    this.appGateway.broadcast(eventId, data, broadcastRoom);
  }

  /**
   * To re-calculaet
   * @private
   */
  private calculateActiveFeatures() {
    let features = FeatureBit.None;
    this.connections.forEach((conn) => {
      features |= conn.activeFeatures;
    });
    this.activeFeatures = features;
    this.logger.warn('################################[' + this.objectId + '] calculateAppFeatures(): ' + this.activeFeatures);
  }

  getAuthorizedRoles(): AuthorizedRoles {
    return 'AnyRole';
  }
}
