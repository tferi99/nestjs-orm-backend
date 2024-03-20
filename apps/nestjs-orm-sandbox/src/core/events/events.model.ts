import { AppEvent } from '@nestjs-orm/client';

export interface ApplicationEvent<T> {
  id: AppEvent | string;
  payload?: T;
  ownerUserName?: string;
}
