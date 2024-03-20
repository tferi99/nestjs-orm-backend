import { Auth, Feature, FeatureConfig, FeatureUtils, WsEvent } from '@nestjs-orm/client';
import { AuthorizedRoles } from '../../client-connection/feature/feature-data-provider-locator.service';
import { ClientConnectionService } from '../../client-connection/client-connection.service';
import { EventsApiService } from '../events/events-api/events-api.service';
import { FeatureEventListener } from './feature-event-listener';

/**
 * Feature data provider responsibilities:
 *  - providing initial data when a client subscribed
 *  - emitting notifications when a feature data has been changed
 *  - emitting notifications when a feature data has been deleted
 */
export interface FeatureDataProvider<D, PK> {
  /**
   * Getting feature provided by this service.
   */
  getFeature(): Feature;

  /**
   * This method called by {@link FeatureDataProviderLocatorService} to initialize the feature crud.
   */
  init();

  /**
   * If a consumer subscribes to a feature this method provides the initial data to
   * {@link FeatureDataProviderLocatorService}.
   *
   * @param user for authorization
   */
  getInitialFeatureData(user: Auth): Promise<D[]>;

  /**
   * To return roles allowed to use this feature.
   */
  getAuthorizedRoles(): AuthorizedRoles;

  /**
   * Call this method to notify consumers about a feature data has been added.
   */
  notifyDataAdded(data: D, user?: string): void;

  /**
   * Call this method to notify consumers about a feature data has been changed.
   */
  notifyDataChanged(data: D, user?: string): void;

  /**
   * Call this method to notify consumerts about a feature data has been deleted.
   */
  notifyDataRemoved(id: PK, user?: string): void;
}

/**
 * Simple implementation of {@link FeatureDataProvider} to provide methods
 * for sending notifications about feature data changes.
 *
 * It can listen to feature data related application events to dispatch them as pushed notification events.
 *
 * IMPORTANT:
 *    - featureEventListener ONLY registered if eventEmitterService specified in constructor
 *    - for troubleshooting use {@link DevController.getEventHandlers()}
 *    - if he expected events have not been registered then check feature parameter in constructor
 */
export abstract class FeatureDataProviderBase<D, PK> implements FeatureDataProvider<D, PK> {
  protected config: FeatureConfig;
  private featureEventListener?: FeatureEventListener<D, PK>;

  // NOTE: eventEmitterService provides API also for event listeners.
  constructor(
    protected feature: Feature,
    protected clientConnectionService: ClientConnectionService,
    eventListenerService?: EventsApiService,
  ) {
    this.config = FeatureUtils.getFeatureConfigByFeature(feature);

    // Listen to application events for the current feature and call event handlers here.
    if (eventListenerService) {
      this.featureEventListener = new FeatureEventListener<D, PK>(this.feature, this, eventListenerService);
    }
  }

  abstract init();
  abstract getAuthorizedRoles(): AuthorizedRoles;
  abstract getInitialFeatureData(user: Auth): Promise<D[]>;

  getFeature(): Feature {
    return this.feature;
  }

  notifyDataAdded(data: D, user?: string): void {
    this.clientConnectionService.broadcast({ feature: this.feature, user }, WsEvent.FeatureDataAdded, data);
  }

  notifyDataChanged(data: D, user?: string): void {
    this.clientConnectionService.broadcast({ feature: this.feature, user }, WsEvent.FeatureDataChanged, data);
  }

  notifyDataRemoved(id: PK, user?: string): void {
    this.clientConnectionService.broadcast({ feature: this.feature, user }, WsEvent.FeatureDataRemoved, id);
  }
}
