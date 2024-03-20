import { SetMetadata } from '@nestjs/common';

/**
 * JwtAuthGuard is configured globally in AuthModule.
 * Use this decoration on a method or class if you want to override it and use another guard.
 *
 * How it works?
 * If OVERRIDE_GLOBAL_GUARD_KEY found in metadata then JwtAuthGuard returns with 'true' (ignored).
 */
export const OVERRIDE_GLOBAL_GUARD_KEY = 'isOverrideGlobalGuard';
export const OverrideGlobalGuard = () => SetMetadata(OVERRIDE_GLOBAL_GUARD_KEY, true);
