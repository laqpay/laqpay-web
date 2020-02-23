import { BaseCoin } from './basecoin';
import { coinsId } from '../constants/coins-id.const';
import { environment } from '../../environments/environment';

export class TestCoin extends BaseCoin {
  id = coinsId.test;
  nodeUrl = environment.production ? 'https://node.laqpay.com' : '';
  coinName = 'Testcoin';
  coinSymbol = 'TEST';
  hoursName = 'Test Hours';
  priceTickerId = 'btc-bitcoin';
  coinExplorer = 'https://explorer.testcoin.net';
  imageName = 'testcoin-header.jpg';
  gradientName = 'testcoin-gradient.png';
  iconName = 'testcoin-icon.png';
  bigIconName = 'testcoin-icon-b.png';
}
