import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../feature-modules/admin/user/user.repository';
import { User } from '../core/orm/entity/user.entity';
import { SecurityUtils } from '../core/util/security-utils';
import { Auth, Trace } from '@nestjs-orm/client';
import { UserDisabledException } from '../core/exception/application-exceptions';
import { JwtStrategy } from './passport/jwt.strategy';
import { TraceService } from '../core/trace/trace.service';
import { AuthUtils } from './auth-utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtStrategy: JwtStrategy,
    private userRepository: UserRepository,
    @Inject(forwardRef(() => TraceService)) private traceService: TraceService,
  ) {}

  /**
   * It validates user and if password specified then also against password hash.
   * Use cases:
   *  - From login page: username + password
   *  - From WS (from token): only username
   *
   * It returns promise of current user WITHOUT password.
   *
   *
   * @param username
   * @param password
   */
  async validateUser(username: string, password?: string): Promise<Auth | null> {
    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, `AuthService.validateUser(${username}`);
    }

    //const user: User = await this.userRepository.findOne({ name: username }); // .find({ filter: { name: username } });
    const user: User = await this.userRepository.getByName(username);
    if (!user) {
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.warn(this.logger, Trace.Auth, 'User not found');
      }
      return null;
    }
    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, 'Found user:', user);
    }

    // if we also have password then
    if (password) {
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.verbose(this.logger, Trace.Auth, 'Password validation');
      }
      if (!(await SecurityUtils.validateStringAndHash(password, user.password))) {
        if (this.traceService.isTraceEnabled(Trace.Auth)) {
          this.traceService.warn(this.logger, Trace.Auth, `Bad password (${username})`);
        }
        return null;
      }
    }

    if (!user.active) {
      if (this.traceService.isTraceEnabled(Trace.Auth)) {
        this.traceService.warn(this.logger, Trace.Auth, `User is not active (${username})`);
      }
      throw new UserDisabledException(user.name);
    }

    const auth = AuthUtils.authFromUser(user);
    if (this.traceService.isTraceEnabled(Trace.Auth)) {
      this.traceService.verbose(this.logger, Trace.Auth, `User validated successfully (${username})`);
    }
    return auth;
  }
}
