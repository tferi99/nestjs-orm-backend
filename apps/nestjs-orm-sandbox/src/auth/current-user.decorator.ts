import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * To retrieve the current user (Auth) or a property of the current user as
 * a controller method parameter.
 *
 * Current user (Auth) injected into request by JwtStrategy controlled by JwtAuthGuard.
 *
 */
export const CurrentUser = createParamDecorator((userProperty: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  //console.log('@CurrentUser: ', user);
  return userProperty ? user?.[userProperty] : user;
});
