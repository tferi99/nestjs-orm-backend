import { ClientConnection } from './client-connection.model';
import { ClientConnectionDto, ClientUtils, Feature, FEATURE_USER_SEPARATOR, FeatureDataDistribution, FeatureUtils } from '@nestjs-orm/client';

export interface DataBroadcastTarget {
  feature?: Feature;
  user?: string;
}

export class ClientConnectionUtils {
  /**
   * To client sensitive data removed/truncated:
   * - JWT token (truncated)
   *
   * @param conn
   */
  static convertSensitiveData(conn: ClientConnection): ClientConnectionDto {
    return {
      socketId: conn.socketId,
      clientIp: conn.clientIp,
      roles: conn.roles,
      activeFeatures: conn.activeFeatures,
      auth: conn.auth,
      tokenInfo: conn.tokenInfo
        ? {
            ...conn.tokenInfo,
            token: ClientUtils.getShortToken(conn.tokenInfo?.token),
          }
        : undefined,
      requestHeaders: conn.requestHeaders,
    };
  }

  /**
   * Create broadcasting room name for a global or user-level feature target.
   * The current socket will be joined to this room on feature subscription (addFeature)
   * and this room will be left on feature un-subscription (removeFeature).
   *
   * ID created for features by PushedDataDistribution of feature:
   *  - {@link FeatureDataDistribution.Global}: event will be broadcast to all feature subscribers:
   *          room: feature@
   *
   *  - {@link FeatureDataDistribution.ForFeatureOwner}: event will be broadcast to feature subscribers who logged in as data owner:
   *          room: feature@user
   *
   *  - or authenticated users:
   *          root: @user
   *
   * @param target feature and/or client ID
   */
  static calculateRoomIdForDataDistribution(target: DataBroadcastTarget): string | undefined {
    if (!target.feature && !target.user) {
      return undefined;
    }

    if (target.feature) {
      const cfg = FeatureUtils.getFeatureConfigByFeature(target.feature);
      switch (cfg.dataDistribution) {
        case FeatureDataDistribution.Global:
          return target.feature + FEATURE_USER_SEPARATOR;
        case FeatureDataDistribution.UserSpecific:
          if (!target.user) {
            //throw new Error(`Distributing data for Feature[${target.feature}] requires user`);
            console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.trace(`!!!!!!!!!!!!!!!!!! Distributing data for Feature[${target.feature}] requires user target`);
            console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
          }
          return target.feature + FEATURE_USER_SEPARATOR + target.user;
      }
    } else {
      // user room
      return FEATURE_USER_SEPARATOR + target.user;
    }
  }
}
