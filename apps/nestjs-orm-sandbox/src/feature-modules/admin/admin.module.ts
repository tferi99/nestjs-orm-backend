import { forwardRef, Module } from '@nestjs/common';
import { TraceModule } from '../../core/trace/trace.module';
import { UserController } from './user/user.controller';
import { ConfiguredOrmModule } from '../../config/mikro-orm.config';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../../auth/role/roles.guard';
import { ClientConnectionModule } from '../../client-connection/client-connection.module';

@Module({
  imports: [ConfiguredOrmModule(), forwardRef(() => TraceModule), forwardRef(() => ClientConnectionModule)],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [UserController],
  exports: [],
})
export class AdminModule {}
