export const SENSITIVE_DATA_MASK = '***';

export enum Role {
  None = 'none',
  Admin = 'admin',
  User = 'user',
  All = 'all',
}

export enum RoleBit {
  None = 0x0,
  Admin = 0x1,
  User = 0x2,
}

export interface Auth {
  id: number;
  name: string;
  roles: Role[];
}

export interface AuthRoleTest {
  refIdx: number;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  username: string;
  roles: Role[];
  exp: number;
  iat: number;
}

export interface TokenInfo {
  valid: boolean;
  token: string;
  expiration: number;
  reason?: string;
}

export interface LogoutDto {
  socketId: string;
}

export interface AuthForServer {
  token: string;
  reason: AuthReason;
}

export enum AuthReason {
  Login = 'LOGIN',
  ReConnect = 'RE_CONNECT',
}
