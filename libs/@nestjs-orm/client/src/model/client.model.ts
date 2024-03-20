import { Auth, TokenInfo } from './auth.model';

export interface ClientConnectionDto {
  socketId: string;
  clientIp: string;
  roles: number;
  activeFeatures: number;
  auth?: Auth;
  tokenInfo?: TokenInfo;
  requestHeaders: { [key: string]: string };
}

/*export interface ExpirableConnection {
  id: number;
  owner: Auth;
  lastKeepAlive: number;
}*/
