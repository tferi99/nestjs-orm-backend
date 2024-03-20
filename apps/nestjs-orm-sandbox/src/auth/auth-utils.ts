import { User } from '../core/orm/entity/user.entity';
import { Auth, Role } from '@nestjs-orm/client';

export class AuthUtils {
  static authFromUser(user: User): Auth {
    const auth: Auth = {
      id: user.id,
      name: user.name,
      roles: [],
    };
    if (user.admin) {
      auth.roles.push(Role.Admin);
    }
    if (user.user) {
      auth.roles.push(Role.User);
    }
    return auth;
  }
}
