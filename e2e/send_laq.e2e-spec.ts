import { browser, by, element } from 'protractor';

import { SendLaqPage } from './send_laq.po';
import { WalletsPage } from './wallets.po';

describe('Send Laq', () => {
  let page: SendLaqPage;
  let walletPage: WalletsPage;

  beforeAll(() => {
    browser.get('/').then(() => browser.sleep(500));
    browser.executeScript(
      `window.localStorage.setItem(\'wallets\',
        JSON.stringify([{"label":"Test wallet","addresses":
        [{"address":"2EzqAbuLosF47Vm418kYo2rnMgt6XgGaA1Z"}]}]) );`);

    page = new SendLaqPage();
    walletPage = new WalletsPage();

    page.navigateTo();
  });

  afterAll(() => {
    browser.restartSync();
  });

  it('should preconfigure wallet', () => {
    walletPage.navigateTo().then(() => {
      if (walletPage.canUnlockWallet()) {
        const sendLink = element(by.css('[routerlink="/send"]'));
        return sendLink.click().then(() => {
          expect<any>(true).toBeTruthy();
        });
      } else {
        expect<any>(false).toBeTruthy();
      }
    });
  });

  it('should display title', () => {
    expect<any>(page.getHeaderText()).toEqual('Wallets');
  });

  it('should have wallets', () => {
    expect<any>(page.getWalletsCount()).toBeGreaterThan(0);
  });

  // ************                                                             ************ //
  // THE REST TEST CASES WILL BE FAILED DUE TO USED ADDRESS WHICH DOES NOT HAVE ANY INPUTS //
  // ************                                                             ************ //

  // it('should have laq in wallets', () => {
  //   expect<any>(page.getWalletsWidthMoney().then((wallets) => {
  //     while(1);
  //     return wallets.length;
  //   })).toBeGreaterThan(0);
  // });

  // it('should have wallets enabled', () => {
  //   expect<any>(page.getValidsWallets().then((wallets) => {
  //     return wallets.length;
  //   })).toBeGreaterThan(0);
  // });

  // it('should select valid wallet', () => {
  //   expect<any>(page.selectValidWallet()).toBeTruthy();
  // });

  // it('should not enter wrong amount', () => {
  //   expect<any>(page.getValidWidthWrongAmount()).toBeFalsy();
  // });

  // it('should send laq', () => {
  //   expect<any>(page.getCanSend()).toBeTruthy();
  // });
});
