import { Body, Controller, Put } from '@nestjs/common';
import { UserRepository } from '../../admin/user/user.repository';
import { Auth, ProfileAccountDto } from '@nestjs-orm/client';
import { CurrentUser } from '../../../auth/current-user.decorator';
import { AuthService } from '../../../auth/auth.service';
import { AccountTestFailedException } from '../../../core/exception/application-exceptions';
import { ControllerBase } from '../../../core/controller/controller.base';

@Controller('profile/account')
export class ProfileAccountController extends ControllerBase {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthService,
  ) {
    super();
  }

  @Put('password')
  async changePassword(@Body() dto: ProfileAccountDto, @CurrentUser() me: Auth): Promise<void> {
    console.log('me: ', me);
    console.log(`changePassword: ${dto.currentPassword} -> ${dto.newPassword}`);

    const result = await this.authService.validateUser(me.name, dto.currentPassword);
    if (result === null) {
      throw new AccountTestFailedException(me.name);
    }
    await this.userRepository.update(me.id, { password: dto.newPassword });
    await this.userRepository.flush();
  }
}
