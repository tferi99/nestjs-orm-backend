import { Auth, Feature, FeatureUtils, AppEvent } from '@nestjs-orm/client';
import { EventsApiService } from '../events/events-api/events-api.service';
import { FeatureEventEmitter } from './feature-event-emitter';
import { Request } from 'express';

const AUTH_FOR_FEATURE_EVENT_EMITTER = 'AUTH_FOR_FEATURE_EVENT_EMITTER';

/**
 * Feature event emitter for controllers inherited from {@link OrmCrudControllerBase}
 *
 *
 */
export class FeatureEventEmitterForController<D, PK> {
  private emitter: FeatureEventEmitter<D, PK>;
  private dataOwnedByUser = true;

  constructor(
    private feature: Feature,
    private eventsApiService: EventsApiService,
    dataOwnedByUser?: boolean,
  ) {
    this.emitter = new FeatureEventEmitter<D, PK>(feature, eventsApiService);
    this.dataOwnedByUser = dataOwnedByUser ?? true;
  }

  emitFeatureDataAdded(req: Request, data: D): void {
    const user: string = this.dataOwnedByUser ? this.getAuthForEventEmitter(req).name : undefined;
    this.eventsApiService.emit({
      id: FeatureUtils.createFeatureAppEventId(this.feature, AppEvent.FeatureDataAdded),
      payload: data,
      ownerUserName: user,
    });
  }

  emitFeatureDataChanged(req: Request, data: D): void {
    const user: string = this.dataOwnedByUser ? this.getAuthForEventEmitter(req).name : undefined;
    this.eventsApiService.emit({
      id: FeatureUtils.createFeatureAppEventId(this.feature, AppEvent.FeatureDataChanged),
      payload: data,
      ownerUserName: user,
    });
  }
  emitFeatureDataRemoved(req: Request, id: PK): void {
    const user: string = this.dataOwnedByUser ? this.getAuthForEventEmitter(req).name : undefined;
    this.eventsApiService.emit({
      id: FeatureUtils.createFeatureAppEventId(this.feature, AppEvent.FeatureDataRemoved),
      payload: id,
      ownerUserName: user,
    });
  }

  //------------------------ auth ------------------------
  /**
   * Saving user into the current request as {@link AUTH_FOR_FEATURE_EVENT_EMITTER}.
   *
   * @param req
   * @param auth
   */
  static saveAuthForEventEmitter(req: Request, auth: Auth): void {
    req[AUTH_FOR_FEATURE_EVENT_EMITTER] = auth;
  }

  /**
   * Getting user from the current request for event emitters from {@link AUTH_FOR_FEATURE_EVENT_EMITTER}.
   *
   * @param req
   * @private
   */
  private getAuthForEventEmitter(req: Request) {
    const auth: Auth = req[AUTH_FOR_FEATURE_EVENT_EMITTER];
    if (!auth) {
      throw new Error('Auth not found in request for FeatureEventEmitter');
    }
    return auth;
  }
}
