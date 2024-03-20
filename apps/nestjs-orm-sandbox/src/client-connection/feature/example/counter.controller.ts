import { Controller, Param, ParseIntPipe, Put } from '@nestjs/common';
import { CounterService } from './counter.service';
import { FeatureEventEmitter } from '../../../core/features/feature-event-emitter';
import { Feature } from '@nestjs-orm/client';
import { EventsApiService } from '../../../core/events/events-api/events-api.service';

@Controller('counter')
export class CounterController {
  private featureEventEmitter: FeatureEventEmitter<number, number>;

  constructor(
    private counterService: CounterService,
    eventsApiService: EventsApiService,
  ) {
    this.featureEventEmitter = new FeatureEventEmitter<number, number>(Feature.Counter, eventsApiService);
  }
  @Put('/:value')
  setCounter(@Param('value', ParseIntPipe) value: number) {
    this.counterService.setCounter(value);
    this.featureEventEmitter.emitFeatureDataChanged(value);
  }
}
