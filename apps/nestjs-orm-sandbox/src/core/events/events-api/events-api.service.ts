import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApplicationEvent } from '../events.model';
import { TraceService } from '../../trace/trace.service';
import { Trace } from '@nestjs-orm/client';

/**
 * Wrapper crud to send events or listens to events programmatically.
 * The main reason why I wrapped it into a service is traceability.
 *
 * TODO: add a priority queue for fine tuning, like this: https://www.npmjs.com/package/priorityqueuejs
 * SEE ALSO: https://stackoverflow.com/questions/26114749/assign-priority-to-nodejs-tasks-in-a-event-loop
 */
@Injectable()
export class EventsApiService {
  private readonly logger = new Logger(EventsApiService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => TraceService)) private traceService: TraceService,
  ) {}

  /**
   * Emitter itself is the receiver, too.
   */
  get receiver() {
    return this.eventEmitter;
  }

  emit(event: ApplicationEvent<any>): boolean {
    if (this.traceService.isTraceEnabled(Trace.Events)) {
      const userInfo = event.ownerUserName ? ` for user[${event.ownerUserName}]` : '';
      this.traceService.verbose(this.logger, Trace.Events, `EventEmitterService.emit() event[${event.id}]${userInfo}:`, event);
    }
    return this.eventEmitter.emit(event.id, event);
  }

  async emitAsync(event: ApplicationEvent<any>): Promise<any[]> {
    if (this.traceService.isTraceEnabled(Trace.Events)) {
      const userInfo = event.ownerUserName ? ` for user[${event.ownerUserName}]` : '';
      this.traceService.verbose(this.logger, Trace.Events, `EventEmitterService.emitAsync() event[${event.id}]${userInfo}:`, event);
    }
    return this.eventEmitter.emitAsync(event.id, event);
  }

  getHandlerCount(filter?: string): number {
    if (!filter) {
      filter = '*';
    }
    return this.eventEmitter.listenerCount(filter);
  }

  /**
   * To get list of registered event handlers from NestJS Events module (@nestjs/event-emitter).
   *
   * @param filter for filtering the list with case-insetitive contains criteria
   */
  getHandlers(filter?: string): string[] {
    if (!filter) {
      filter = '*';
    }
    //const handlers = this.eventEmitter.listeners(filter);
    const events = this.eventEmitter.eventNames() as string[];
    return events.filter((h) => h.toLowerCase().includes(filter.toLowerCase()));
  }

  test(ev: string, data: string) {
    this.eventEmitter.emit(ev, data);
  }
}
