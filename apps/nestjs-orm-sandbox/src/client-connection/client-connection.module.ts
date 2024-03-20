import { forwardRef, Module } from '@nestjs/common';
import { ClientConnectionController } from './client-connection.controller';
import { ClientConnectionService } from './client-connection.service';
import { CounterService } from './feature/example/counter.service';
import { FeatureDataProviderLocatorService } from './feature/feature-data-provider-locator.service';
import { JwtModule } from '@nestjs/jwt';
import { TraceModule } from '../core/trace/trace.module';
import { AuthModule } from '../auth/auth.module';
import { ConfiguredOrmModule } from '../config/mikro-orm.config';
import { EnvUtils } from '../core/util/env-utils';
import { ProfileModule } from '../feature-modules/profile/profile.module';
import { ConfigModule } from '../core/config/config.module';
import { AppGateway } from './app.gateway';
import { EventsApiModule } from '../core/events/events-api/events-api.module';
import { CounterController } from './feature/example/counter.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: EnvUtils.getValue('JWT_SECRET'),
      signOptions: { expiresIn: EnvUtils.getValue('JWT_EXPIRATION') }, // from https://github.com/vercel/ms
    }),
    ConfiguredOrmModule(),
    forwardRef(() => TraceModule),
    forwardRef(() => AuthModule),
    forwardRef(() => ProfileModule),
    forwardRef(() => ConfigModule),
    EventsApiModule,
  ],
  controllers: [ClientConnectionController, CounterController],
  providers: [ClientConnectionService, CounterService, FeatureDataProviderLocatorService, AppGateway],
  exports: [ClientConnectionService, FeatureDataProviderLocatorService],
})
export class ClientConnectionModule {}
