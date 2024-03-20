import { Injectable } from '@nestjs/common';
import { EventsApiService } from '../../core/events/events-api/events-api.service';
import { OnEvent } from '@nestjs/event-emitter';
import { ClientConnectionService } from '../../client-connection/client-connection.service';
import { AppEvent } from '@nestjs-orm/client';

const CRASH_ON_TEST_ERROR = true;

@Injectable()
export class EventTestService {
  private eventTestEnabled = false;

  constructor(
    private eventsApiService: EventsApiService,
    private clientConnectionService: ClientConnectionService,
  ) {}

  stopEventTest() {
    console.log('stopEventTest');
    this.eventTestEnabled = false;
  }

  async startEventTest() {
    console.log('startEventTest');
    this.eventTestEnabled = true;
    this.eventsApiService.emit({
      id: AppEvent.TestA,
      payload: 'A',
    });
  }
  async eventTestError(msg: string) {
    console.log('eventTestError');
    this.eventsApiService.emit({
      id: AppEvent.TestError,
      payload: msg,
    });
  }

  //---------------------------------- sync event test ----------------------------------
  @OnEvent(AppEvent.TestA)
  async onTestA() {
    console.log('On event: ' + AppEvent.TestA);
    if (!this.eventTestEnabled) {
      console.log('Stopped on ' + AppEvent.TestA);
      return;
    }
    this.eventsApiService.emit({
      id: AppEvent.TestB,
      payload: 'B',
    });
  }

  @OnEvent(AppEvent.TestB)
  async onTestB() {
    console.log('On event: ' + AppEvent.TestB);
    if (!this.eventTestEnabled) {
      console.log('Stopped on ' + AppEvent.TestB);
      return;
    }
    this.eventsApiService.emit({
      id: AppEvent.TestC,
      payload: 'C',
    });
  }

  @OnEvent(AppEvent.TestC)
  async onTestC(): Promise<void> {
    console.log('On event: ' + AppEvent.TestC);
    if (!this.eventTestEnabled) {
      console.log('Stopped on ' + AppEvent.TestC);
      return;
    }
    this.eventsApiService.emit({
      id: AppEvent.TestA,
      payload: 'A',
    });
  }

  //---------------------------------- async event test ----------------------------------
  async startEventTestAsync() {
    console.log('startEventTestAsync');
    this.eventTestEnabled = true;
    this.eventsApiService.emit({
      id: AppEvent.TestAAsync,
      payload: 'A',
    });
  }

  @OnEvent(AppEvent.TestAAsync, { async: true })
  async onTestAAsync() {
    console.log('On event: ' + AppEvent.TestAAsync);
    if (!this.eventTestEnabled) {
      console.log('Stopped on ' + AppEvent.TestAAsync);
      return;
    }
    this.eventsApiService.emit({
      id: AppEvent.TestBAsync,
      payload: 'B Async',
    });
  }

  @OnEvent(AppEvent.TestBAsync, { async: true })
  async onTestBAsync() {
    console.log('On event: ' + AppEvent.TestBAsync);
    if (!this.eventTestEnabled) {
      console.log('Stopped on ' + AppEvent.TestBAsync);
      return;
    }
    this.eventsApiService.emit({
      id: AppEvent.TestCAsync,
      payload: 'C Async',
    });
  }

  @OnEvent(AppEvent.TestCAsync, { async: true })
  async onTestCAsync() {
    console.log('On event: ' + AppEvent.TestCAsync);
    if (!this.eventTestEnabled) {
      console.log('Stopped on ' + AppEvent.TestCAsync);
      return;
    }
    this.eventsApiService.emit({
      id: AppEvent.TestAAsync,
      payload: 'A Async',
    });
  }

  @OnEvent(AppEvent.TestError)
  async onTestError() {
    console.log('On event: ' + AppEvent.TestError);

    if (CRASH_ON_TEST_ERROR) {
      throw new Error('THIS IS TEST ERROR');
    } else {
      try {
        throw new Error('THIS IS TEST ERROR');
      } catch (err) {
        console.error('Test error:', err);
      }
    }
  }

  @OnEvent(AppEvent.TestGetActiveFeaures)
  async onTestGetActiveFeaures() {
    console.log('AppEvent.TestGetActiveFeaures >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ' + this.clientConnectionService.activeFeatures);
  }
}
