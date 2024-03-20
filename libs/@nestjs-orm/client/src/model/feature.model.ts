import { Role } from './auth.model';

export enum Feature {
  // common
  AppConfig = 'APP_CONFIG', // added on connection, not removed
  UserConfig = 'USER_CONFIG', // added when client authorized, cleared only on logout
  Counter = 'COUNTER', // managed by component

  // admin
  ClientMonitor = 'CLIENT_MONITOR',
}

/**
 * Length of feature role bitmasks.
 */
const FEATURE_ROLE_BITS_RANGE_LEN = 8;

/**
 * IMPORTANT !!!
 * You MUST change bitmask length constant if you extend role bit range {@link FEATURE_ROLE_BITS_RANGE_LEN}.
 */
export enum FeatureBit {
  // common
  None = 0x0,
  AppConfig = 0x1,
  UserConfig = 0x2,
  Counter = 0x4,
  // = 0x8
  // = 0x10,
  // = 0x20,
  // = 0x40;
  // = 0x80;

  // admin
  ClientMonitor = 0x100,
  // = 0x200,
  // = 0x400;
  // = 0x800;
  // = 0x1000;
  // = 0x2000;
  // = 0x4000;
  // = 0x8000;

  // other
  // = 0x10000,
  // = 0x20000,
  // = 0x40000,
  // = 0x80000,
  // = 0x100000,
  // = 0x200000,
  // = 0x400000,
  // = 0x800000,
}

/**
 * Calculated feature role bitmasks.
 * You can use these masks to get role-related feature bits only.
 *
 * Calculation:
 *    - shift the 1st bit to left by length of the role bit range {@link FEATURE_ROLE_BITS_RANGE_LEN} (-> 10000)
 *    - decrement it (-> 1111)
 *    - remove the lower ranges (-> 1100)
 */
export const FEATURE_ROLE_BITMASK_COMMON: number = (1 << FEATURE_ROLE_BITS_RANGE_LEN) - 1;
export const FEATURE_ROLE_BITMASK_ADMIN: number = (1 << (2 * FEATURE_ROLE_BITS_RANGE_LEN)) - 1 - FEATURE_ROLE_BITMASK_COMMON;
export const FEATURE_ROLE_BITMASK_USER: number = (1 << (3 * FEATURE_ROLE_BITS_RANGE_LEN)) - 1 - FEATURE_ROLE_BITMASK_COMMON - FEATURE_ROLE_BITMASK_ADMIN;

export enum FeatureDataDistribution {
  Global = 'GLOBAL',
  UserSpecific = 'USER_SPECIFIC',
}

export interface FeatureConfig {
  feature: Feature;
  bitValue: FeatureBit;
  label: string;
  abbreviation: string;

  /**
   * Role (one of these - OR) required to get initial data of this feature.
   * {@link Role.All} means any role is authorized for this frsture.
   */
  initialDataRoles: Role[];

  dataDistribution: FeatureDataDistribution;
}

/**
 * Metadata for feature-modules.
 * This array is converted into {@link FeatureUtils.featureConfigByFeature} during startup.
 *
 * By default, a feature is NOT authorized.
 */
export const FEATURE_CONFIG: FeatureConfig[] = [
  // common
  {
    feature: Feature.AppConfig,
    bitValue: FeatureBit.AppConfig,
    label: 'Application Config',
    abbreviation: 'ACfg',
    initialDataRoles: [Role.All],
    dataDistribution: FeatureDataDistribution.Global,
  },
  {
    feature: Feature.UserConfig,
    bitValue: FeatureBit.UserConfig,
    label: 'User Config',
    abbreviation: 'UCfg',
    initialDataRoles: [Role.All],
    dataDistribution: FeatureDataDistribution.UserSpecific,
  },
  {
    feature: Feature.Counter,
    bitValue: FeatureBit.Counter,
    label: 'Dev Counter',
    abbreviation: 'C',
    initialDataRoles: [Role.All],
    dataDistribution: FeatureDataDistribution.Global,
  },

  // admin
  {
    feature: Feature.ClientMonitor,
    bitValue: FeatureBit.ClientMonitor,
    label: 'Client Monitor',
    abbreviation: 'CMon',
    initialDataRoles: [Role.Admin],
    dataDistribution: FeatureDataDistribution.Global,
  },
];
