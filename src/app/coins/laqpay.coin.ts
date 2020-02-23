import { BaseCoin } from './basecoin';
import { coinsId } from '../constants/coins-id.const';
import { environment } from '../../environments/environment';

export class LaqpayCoin extends BaseCoin {
  id = coinsId.laq;
  nodeUrl = environment.production ? 'https://node.laqpay.com' : '';
  coinName = 'LaQ Pay';
  coinSymbol = 'LAQ';
  hoursName = 'LAQH';
  priceTickerId = 'laq-laqpay';
  coinExplorer = 'https://explorer.laqpay.com';
  imageName = 'laqpay-header.jpg';
  gradientName = 'laqpay-gradient.png';
  iconName = 'laqpay-icon.png';
  bigIconName = 'laqpay-icon-b.png';
}
