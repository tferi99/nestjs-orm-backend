/**
 * Internal application events
 */
export enum AppEvent {
  // test messages
  Test = 'Test',
  TestA = 'Test.A',
  TestB = 'Test.B',
  TestC = 'Test.C',
  TestAAsync = 'Test.A.Async',
  TestBAsync = 'Test.B.Async',
  TestCAsync = 'Test.C.Async',
  TestError = 'Test.Error',
  TestGetActiveFeaures = 'Test.GetActiveFeaures',

  // App
  AppInit = 'App.Init',
  AppInited = 'App.Inited',

  // init

  // Features
  FeatureDataAdded = 'feature_data_added',
  FeatureDataChanged = 'feature_data_changed',
  FeatureDataRemoved = 'feature_data_removed',
}

/**
 * WebSocket events
 */
export enum WsEvent {
  // general
  Connected = 'connected',
  Error = 'error',
  PingWithAuth = 'ping_with_auth',
  PingAdminOnly = 'ping_admin_only',
  Ping = 'ping',
  Pong = 'pong',
  Exception = 'exception', // sent when WsException thrown
  GenerateWsError = 'generate_ws_error',
  GenerateError = 'generate_error',

  // auth
  Auth = 'auth',
  Authorized = 'authorized',
  AuthError = 'auth_error',
  Logout = 'logout',

  // feature
  AddFeature = 'add_feature',
  RemoveFeature = 'remove_feature',
  FeatureAdded = 'feature_added',
  FeatureNotAdded = 'feature_not_added',
  FeatureDataAdded = 'feature_data_added',
  FeatureDataChanged = 'feature_data_changed',
  FeatureDataRemoved = 'feature_data_removed',

  // config
  UserConfig = 'user_config',
  AppConfigChanged = 'app_config_changed',
  UserConfigChanged = 'user_config_changed',

  // admin maintenance
  LogoutOnUserChange = 'logout_on_user_change', // logout changed/deleted user in all browsers
}
