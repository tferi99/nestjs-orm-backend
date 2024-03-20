import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './passport/jwt.strategy';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './passport/local.strategy';
import { ConfiguredOrmModule } from '../config/mikro-orm.config';
import { ClientConnectionModule } from '../client-connection/client-connection.module';
import { TraceModule } from '../core/trace/trace.module';
import { EnvUtils } from '../core/util/env-utils';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: EnvUtils.getValue('JWT_SECRET'),
      signOptions: { expiresIn: EnvUtils.getValue('JWT_EXPIRATION') }, // from https://github.com/vercel/ms
    }),
    ConfiguredOrmModule(),
    forwardRef(() => TraceModule),
    forwardRef(() => ClientConnectionModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // globally activate - you can override it with controller/method level with @OverrideGlobalGuard
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
