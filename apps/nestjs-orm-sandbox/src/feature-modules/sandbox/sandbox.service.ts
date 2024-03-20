import { Injectable } from '@nestjs/common';

const sleep = async (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const functionThatThrows = async (): Promise<void> => {
  await sleep(2000);

  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! crashing NOW !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  throw new Error("this test error CAN crash the application if you don't handle it");
};

@Injectable()
export class SandboxService {
  async doCrash(): Promise<string> {
    console.log('SandboxService.doCrash()');
    throw new Error('Test error from SandboxService.doCrash()');
    return 'ok';
  }

  public async crash(): Promise<void> {
    console.log('crashing the app in 3 seconds...');
    await sleep(1000);
    functionThatThrows(); // async function called without await
  }
}
