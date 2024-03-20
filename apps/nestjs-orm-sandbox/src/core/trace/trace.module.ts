import { forwardRef, Module } from '@nestjs/common';
import { TraceService } from './trace.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [forwardRef(() => ConfigModule)],
  providers: [TraceService],
  exports: [TraceService],
})
export class TraceModule {}
