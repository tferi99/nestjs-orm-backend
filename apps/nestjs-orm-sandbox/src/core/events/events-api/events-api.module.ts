import { Module } from '@nestjs/common';
import { EventsApiService } from './events-api.service';
import { TraceModule } from '../../trace/trace.module';

@Module({
  imports: [TraceModule],
  providers: [EventsApiService],
  exports: [EventsApiService],
})
export class EventsApiModule {}
