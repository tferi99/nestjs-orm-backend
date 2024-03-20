import { forwardRef, Module } from '@nestjs/common';
import { ProfileAccountController } from './account/profile-account.controller';
import { ConfiguredOrmModule } from '../../config/mikro-orm.config';
import { ProfileController } from './profile.controller';
import { AuthModule } from '../../auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../../auth/role/roles.guard';
import { TraceModule } from '../../core/trace/trace.module';
import { EventsApiModule } from '../../core/events/events-api/events-api.module';
import { ClientConnectionModule } from '../../client-connection/client-connection.module';

@Module({
  imports: [ConfiguredOrmModule(), forwardRef(() => AuthModule), forwardRef(() => TraceModule), forwardRef(() => ClientConnectionModule), EventsApiModule],
  controllers: [ProfileController, ProfileAccountController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [],
})
export class ProfileModule {}
