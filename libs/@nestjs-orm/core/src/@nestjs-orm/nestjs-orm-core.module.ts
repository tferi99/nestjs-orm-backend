import { Module } from '@nestjs/common';
import { NestjsOrmCoreService } from './nestjs-orm-core.service';

@Module({
  providers: [NestjsOrmCoreService],
  exports: [NestjsOrmCoreService],
})
export class NestjsOrmCoreModule {}
