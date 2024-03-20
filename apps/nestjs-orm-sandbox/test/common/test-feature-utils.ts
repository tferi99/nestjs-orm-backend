import { AppConfig, Feature, FeatureUtils, WsEvent } from '@nestjs-orm/client';
import { TestWsClient } from './test-ws-client';

export interface AddFeatureCallBack {
  (data: any): void;
}

export class TestFeatureUtils {
  static addFeature = (client: TestWsClient, done: jest.DoneCallback, feature: Feature, callback?: AddFeatureCallBack) => {
    const ev = FeatureUtils.createFeatureWsEventId(feature, WsEvent.FeatureAdded);
    client.socket.on(ev, (res) => {
      const data: AppConfig = res;
      if (callback) {
        callback(data);
      }
      done();
    });
    client.socket.emit(WsEvent.AddFeature, feature);
  };
}
