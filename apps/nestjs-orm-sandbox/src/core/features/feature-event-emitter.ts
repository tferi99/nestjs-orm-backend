import { Feature, FeatureUtils, AppEvent } from '@nestjs-orm/client';
import { EventsApiService } from '../events/events-api/events-api.service';

/**
 *
 */
export class FeatureEventEmitter<D, PK> {
  constructor(
    private feature: Feature,
    private eventsApiService: EventsApiService,
  ) {}

  emitFeatureDataAdded(data: D, user?: string): void {
    this.eventsApiService.emit({
      id: FeatureUtils.createFeatureAppEventId(this.feature, AppEvent.FeatureDataAdded),
      payload: data,
      ownerUserName: user,
    });
  }

  emitFeatureDataChanged(data: D, user?: string): void {
    this.eventsApiService.emit({
      id: FeatureUtils.createFeatureAppEventId(this.feature, AppEvent.FeatureDataChanged),
      payload: data,
      ownerUserName: user,
    });
  }
  emitFeatureDataRemoved(id: PK, user?: string): void {
    this.eventsApiService.emit({
      id: FeatureUtils.createFeatureAppEventId(this.feature, AppEvent.FeatureDataRemoved),
      payload: id,
      ownerUserName: user,
    });
  }
}
