import { Controller, Get } from '@nestjs/common';
import { User } from '../../core/orm/entity/user.entity';
import { UserRepository } from '../admin/user/user.repository';
import { Auth } from '@nestjs-orm/client';
import { CurrentUser } from '../../auth/current-user.decorator';
import { ControllerBase } from '../../core/controller/controller.base';

@Controller('profile')
export class ProfileController extends ControllerBase {
  constructor(private userRepository: UserRepository) {
    super();
  }

  @Get()
  async getProfileForCurrentUser(@CurrentUser() me: Auth): Promise<User> {
    const u: User = await this.userRepository.findOne({ id: me.id });
    console.log('ME: ', me);
    console.log('USER: ', u);
    return u;
  }
}
