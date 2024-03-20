import { ForbiddenException, Inject, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Auth, Role } from '@nestjs-orm/client';
import { ClientConnectionService } from '../../client-connection/client-connection.service';

export abstract class ControllerBase {
  private readonly _logger = new Logger(ControllerBase.name);

  get logger() {
    return this._logger;
  }

  @Inject(REQUEST)
  private request;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ControllerBase() {}

  checkCallEnabledCondition(condition: boolean): void {
    if (!condition) {
      throw new ForbiddenException();
    }
  }

  dumpCurrentUser() {
    console.log('# Current user:', this.getCurrentUser());
  }

  getCurrentUser(): Auth {
    return this.request.user;
  }

  getCurrentUserId(): number {
    const auth = this.getCurrentUser();
    if (auth == undefined) {
      return -10000;
    }
    return Number(auth.id);
  }

  isCurrentUserAdmin(): boolean {
    const auth = this.getCurrentUser();
    if (auth == undefined) {
      return false;
    }
    return auth.roles.includes(Role.Admin);
  }

  getClassName(): string {
    return (<any>this).constructor.name;
  }
}
