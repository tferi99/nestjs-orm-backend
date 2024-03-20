import { Auth, TokenInfo } from '@nestjs-orm/client';

export interface ClientConnection {
  socketId: string;
  clientIp: string;
  roles: number; // bits from RoleBit for performance - calculated from auth.roles
  activeFeatures: number; // bits from FeatureBit
  auth?: Auth;
  tokenInfo?: TokenInfo;
  requestHeaders: { [key: string]: string };
}
