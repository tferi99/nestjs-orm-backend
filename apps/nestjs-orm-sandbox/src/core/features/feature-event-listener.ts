import { FeatureDataProvider } from './feature-data-provider';
import { EventsApiService } from '../events/events-api/events-api.service';
import { Feature, FeatureUtils, AppEvent } from '@nestjs-orm/client';
import { ApplicationEvent } from '../events/events.model';

/**
 * It listens to application events emitted by controllers and the business logic,
 * and it dispatches them to event handlers of feature data providers which
 * wrap application event into pushed messages.
 */
export class FeatureEventListener<D, PK> {
  constructor(
    feature: Feature,
    private featureDataProvider: FeatureDataProvider<D, PK>,
    private eventsApiService: EventsApiService,
  ) {
    this.eventsApiService.receiver.on(FeatureUtils.createFeatureAppEventId(feature, AppEvent.FeatureDataAdded), (event: ApplicationEvent<D>) =>
      this.featureDataProvider.notifyDataAdded(event.payload, event.ownerUserName),
    );
    this.eventsApiService.receiver.on(FeatureUtils.createFeatureAppEventId(feature, AppEvent.FeatureDataChanged), (event: ApplicationEvent<D>) =>
      this.featureDataProvider.notifyDataChanged(event.payload, event.ownerUserName),
    );
    this.eventsApiService.receiver.on(FeatureUtils.createFeatureAppEventId(feature, AppEvent.FeatureDataRemoved), (event: ApplicationEvent<PK>) =>
      this.featureDataProvider.notifyDataRemoved(event.payload, event.ownerUserName),
    );
  }
}
