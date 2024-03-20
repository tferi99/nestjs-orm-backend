import { Feature, FEATURE_CONFIG, FEATURE_ROLE_BITMASK_ADMIN, FEATURE_ROLE_BITMASK_COMMON, FEATURE_ROLE_BITMASK_USER, FeatureBit, FeatureConfig } from '../model/feature.model';
import { Role } from '../model/auth.model';
import { AppEvent, WsEvent } from '../model/event.model';

export const FEATURE_USER_SEPARATOR = '@';

export class FeatureUtils {
  /**
   * Feature descriptor map by Feature ID.
   */
  private static _featureConfigByFeature: Map<Feature, FeatureConfig>;

  /**
   * Feature descriptor map by bit value.
   */
  private static _featureConfigByBitValue: Map<FeatureBit, FeatureConfig>;

  /**
   * It returns map of feature infos by feature-modules.
   *
   * It created from {@link FEATURE_CONFIG} array on-demand during the 1st call.
   */
  public static get featureConfigByFeature(): Map<Feature, FeatureConfig> {
    if (!FeatureUtils._featureConfigByFeature) {
      FeatureUtils._featureConfigByFeature = new Map<Feature, FeatureConfig>();
      for (const cfg of FEATURE_CONFIG) {
        FeatureUtils._featureConfigByFeature.set(cfg.feature, cfg);
      }
    }
    return FeatureUtils._featureConfigByFeature;
  }

  /**
   * It returns map of feature infos by feature bit values.
   *
   * It created from {@link FEATURE_CONFIG} array on-demand during the 1st call.
   */
  public static get featureConfigByBitValue(): Map<FeatureBit, FeatureConfig> {
    if (!FeatureUtils._featureConfigByBitValue) {
      FeatureUtils._featureConfigByBitValue = new Map<FeatureBit, FeatureConfig>();
      for (const cfg of FEATURE_CONFIG) {
        FeatureUtils._featureConfigByBitValue.set(cfg.bitValue, cfg);
      }
    }
    return FeatureUtils._featureConfigByBitValue;
  }

  /**
   * It returns a feature info by feature from map {@link FEATURE_CONFIG}
   *
   * @param feature
   */
  static getFeatureConfigByFeature(feature: Feature): FeatureConfig {
    const ret = FeatureUtils.featureConfigByFeature.get(feature);
    if (!ret) {
      throw new Error(feature + ' : configuration not not found for this feature');
    }
    return ret;
  }

  /**
   * It returns a feature info by feature bit value from map.
   *
   * @param feature
   */
  static getFeatureConfigByBitValue(bitValue: FeatureBit): FeatureConfig {
    const ret = FeatureUtils.featureConfigByBitValue.get(bitValue);
    if (!ret) {
      throw new Error(bitValue + ' : feature not found for this bit value');
    }
    return ret;
  }

  static featureToBitValue(feature: Feature): FeatureBit {
    const cfg = FeatureUtils.getFeatureConfigByFeature(feature);
    return cfg != undefined ? cfg.bitValue : FeatureBit.None;
  }

  static featureBitsToFeatureConfigs(features: number): FeatureConfig[] {
    const ret: FeatureConfig[] = [];

    for (const cfg of FEATURE_CONFIG) {
      if (features & cfg.bitValue) {
        ret.push(cfg);
      }
    }
    return ret;
  }

  static featureBitsToString(features: number): string {
    let out = '';
    for (const cfg of FEATURE_CONFIG) {
      if (features & cfg.bitValue) {
        out += cfg.feature + '; ';
      }
    }
    return out;
  }

  static addFeatureToBitValues(features: number, feature: Feature): number {
    const featureValue = FeatureUtils.featureToBitValue(feature);
    return features | featureValue;
  }

  static removeFeatureFromBitValues(features: number, feature: Feature): number {
    const featureValue = FeatureUtils.featureToBitValue(feature);
    return features & ~featureValue;
  }

  static isFeatureExistInBitValues(features: number, feature: Feature): boolean {
    const featureValue = FeatureUtils.featureToBitValue(feature);
    return (features & featureValue) !== 0;
  }

  static featureBitsOfRole(features: number, role: Role): number {
    switch (role) {
      case Role.None:
        return features & FEATURE_ROLE_BITMASK_COMMON;
      case Role.Admin:
        return features & FEATURE_ROLE_BITMASK_ADMIN;
      case Role.User:
        return features & FEATURE_ROLE_BITMASK_USER;
      default:
        return features;
    }
  }

  /**
   * To create WS event ID for feature data distribution.
   *
   * @param feature
   * @param action
   */
  static createFeatureWsEventId(feature: Feature, action: WsEvent): string {
    return action + '[' + feature + ']';
  }

  /**
   * To create application event ID for internal messaging.
   *
   * @param feature
   * @param event
   */
  static createFeatureAppEventId(feature: Feature, event: AppEvent): string {
    return event + '[' + feature + ']';
  }
}
