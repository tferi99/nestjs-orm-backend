import { User, SENSITIVE_DATA_MASK } from '@nestjs-orm/client';
import { User as UserEntity } from '../../../core/orm/entity/user.entity';

export class ClientConnectionUtils {
  static convertSensitiveData(user: UserEntity): User {
    return {
      id: user.id,
      name: user.name,
      password: SENSITIVE_DATA_MASK,
      active: user.active,
      admin: user.admin,
      user: user.user,
      created: user.created,
      updated: user.updated,
    };
  }
}
