export * from './model/auth.model';
export * from './model/client.model';
export * from './model/feature.model';
export * from './model/event.model';
export * from './model/config.model';
export * from './model/trace.model';
export * from './model/dev.model';

export interface ProfileAccountDto {
  currentPassword: string;
  newPassword: string;
}

export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD = 'admin';
export const DEFAULT_USER_USERNAME = 'user';
export const DEFAULT_USER_PASSWORD = 'user';

export interface ConnectionError {
  errorId?: string;
  errorMessage?: string;
}

