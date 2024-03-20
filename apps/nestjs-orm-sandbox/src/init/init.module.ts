import { forwardRef, Module } from '@nestjs/common';
import { InitService } from './init.service';
import { TraceModule } from '../core/trace/trace.module';
import { ConfiguredOrmModule } from '../config/mikro-orm.config';
import { ConfigModule } from '../core/config/config.module';
import { EventsApiModule } from '../core/events/events-api/events-api.module';
import { TaskExecutorModule } from '../task-executor/task-executor.module';
import { ClientConnectionModule } from '../client-connection/client-connection.module';

@Module({
  imports: [
    ConfiguredOrmModule(),
    forwardRef(() => ConfigModule),
    forwardRef(() => TraceModule),
    forwardRef(() => ClientConnectionModule),
    EventsApiModule,
    TaskExecutorModule,
  ],
  providers: [InitService],
  exports: [InitService],
})
export class InitModule {}
