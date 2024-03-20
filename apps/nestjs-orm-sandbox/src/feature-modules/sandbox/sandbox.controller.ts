import { Controller, forwardRef, Get, Inject } from '@nestjs/common';
import { EventTestService } from './event-test.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsApiService } from '../../core/events/events-api/events-api.service';
import { AppConfigService } from '../../core/config/app-config/app-config.service';
import { SandboxService } from './sandbox.service';
import { AppConfigId } from '@nestjs-orm/client';

@Controller('sandbox')
export class SandboxController {
  constructor(
    private eventTestService: EventTestService,
    private eventEmitter: EventEmitter2,
    private eventsApiService: EventsApiService,
    private sandboxService: SandboxService,
    @Inject(forwardRef(() => AppConfigService)) private appConfigService: AppConfigService,
  ) {}

  @Get('startEventTest')
  async startEventTest(): Promise<string> {
    this.eventTestService.startEventTest();
    return 'ok';
  }

  @Get('startEventTestAsync')
  async startEventTestAsync(): Promise<string> {
    this.eventTestService.startEventTestAsync();
    return 'ok';
  }

  @Get('stopEventTest')
  async stopEventTest(): Promise<string> {
    this.eventTestService.stopEventTest();
    return 'ok';
  }

  @Get('test')
  async test(): Promise<string> {
    console.log('test() START');
    this.eventEmitter.emit('cica', 'kutya');
    console.log('test() END');
    return 'ok';
  }

  @Get('test2')
  async test2(): Promise<string> {
    console.log('test2() START');
    this.eventsApiService.test('valag', 'picsa');
    console.log('test2() END');
    return 'ok';
  }

  @Get('appcfgerr')
  async generateAppCfgErr(): Promise<void> {
    console.log('generateAppCfgErr START');
    const val = this.appConfigService.getBoolean(AppConfigId.DummyForError);
    console.log('generateAppCfgErr END');
  }

  @Get('crash1')
  async doCrash1(): Promise<string> {
    this.eventTestService.eventTestError('Test error generated from controller');
    return 'ok';
  }

  @Get('crash2')
  async doCrash2(): Promise<string> {
    return this.sandboxService.doCrash();
  }

  @Get('/crash3')
  public async crash(): Promise<void> {
    await this.sandboxService.crash();
  }
}
