import { forwardRef, Module } from '@nestjs/common';
import { TaskExecutorService } from './task-executor.service';
import { TaskExecutorController } from './task-executor.controller';
import { TraceModule } from '../core/trace/trace.module';

@Module({
  imports: [forwardRef(() => TraceModule)],
  providers: [TaskExecutorService],
  controllers: [TaskExecutorController],
  exports: [TaskExecutorService],
})
export class TaskExecutorModule {}
