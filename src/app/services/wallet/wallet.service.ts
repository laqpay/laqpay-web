import { Injectable, EventEmitter, Injector } from '@angular/core';
import 'rxjs/add/operator/mergeMap';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';
import { BigNumber } from 'bignumber.js';

import { CipherProvider, GenerateAddressResponse } from '../cipher.provider';
import { Address, Wallet } from '../../app.datatypes';
import { convertAsciiToHexa } from '../../utils/converters';
import { defaultCoinId } from '../../constants/coins-id.const';
import { BaseCoin } from '../../coins/basecoin';
import { CoinService } from '../coin.service';
import { ApiService } from '../api.service';
import { environment } from '../../../environments/environment';

export class ScanProgressData {
  addressesFound = 1;
  progress = 0;
}

@Injectable()
export class WalletService {
  wallets: BehaviorSubject<Wallet[]> = new BehaviorSubject<Wallet[]>([]);

  private currentCoin: BaseCoin;

  constructor(
    private cipherProvider: CipherProvider,
    private translate: TranslateService,
    private coinService: CoinService,
    private apiService: ApiService,
  ) {
    this.loadWallets();
    this.coinService.currentCoin.subscribe((coin) => this.currentCoin = coin);
  }

  get haveWallets(): Observable<boolean> {
    return this.wallets.map(wallets => wallets ? wallets.length > 0 : false);
  }

  get currentWallets(): Observable<Wallet[]> {
    return this.wallets
      .flatMap(wallets => this.coinService.currentCoin
        .map((coin: BaseCoin) => wallets.filter(wallet => wallet.coinId === coin.id))
      ).map(wallets => wallets ? wallets : []);
  }

  get addresses(): Observable<Address[]> {
    return this.currentWallets.map(wallets => wallets.reduce((array, wallet) => array.concat(wallet.addresses), []));
  }

  addAddress(wallet: Wallet, saveWallet = true): Observable<void> {
    if (!wallet.seed || !wallet.nextSeed) {
      throw new Error(this.translate.instant('service.wallet.address-without-seed'));
    }

    return this.cipherProvider.generateAddress(wallet.nextSeed)
      .map((response: GenerateAddressResponse) => {
        wallet.nextSeed = response.nextSeed;
        wallet.addresses.push(response.address);
        if (saveWallet) {
          this.saveWallets();
        }
      });
  }

  create(label: string, seed: string, coinId: number, save = true): Observable<Wallet> {
    seed = this.getCleanSeed(seed);

    return this.cipherProvider.generateAddress(convertAsciiToHexa(seed))
      .map((response: GenerateAddressResponse) => {
        const wallet = {
          label: label,
          seed: seed,
          needSeedConfirmation: true,
          balance: new BigNumber('0'),
          hours: new BigNumber('0'),
          addresses: [response.address],
          nextSeed: response.nextSeed,
          coinId: coinId
        };

        if (this.wallets.value.some((wlt: Wallet) =>
            wlt.addresses[0].address === wallet.addresses[0].address &&
            wlt.coinId === wallet.coinId)) {
          throw new Error(this.translate.instant('service.wallet.wallet-exists'));
        }

        if (save) {
          this.add(wallet);
        }

        return wallet;
      });
  }

  add(wallet: Wallet) {
    this.wallets.value.push(wallet);
    this.saveWallets();
  }

  delete(wallet: Wallet) {
    const index = this.wallets.value.indexOf(wallet);
    if (index !== -1) {
      this.wallets.value.splice(index, 1);

      this.saveWallets();
    }
  }

  scanAddresses(wallet: Wallet, onProgressChanged: EventEmitter<ScanProgressData>): Observable<void> {
    if (wallet.addresses.length !== 1) {
      throw new Error(this.translate.instant('service.wallet.invalid-wallet'));
    }

    const InitialNextSeed = wallet.nextSeed;

    return this.checkWalletAddresses(wallet, 0, onProgressChanged, InitialNextSeed)
      .map(lastIndexWithTxs => {
        const unnecessaryAddresses = wallet.addresses.length - 1 - lastIndexWithTxs;
        if (unnecessaryAddresses > 0) {
          wallet.addresses.splice(lastIndexWithTxs + 1, unnecessaryAddresses);
        }
        this.saveWallets();
      })
      .catch(error => {
        if (wallet.addresses.length > 1) {
          wallet.addresses.splice(1, wallet.addresses.length - 1);
          wallet.nextSeed = InitialNextSeed;
        }
        return Observable.throw(error);
      });
  }

  unlockWallet(wallet: Wallet, seed: string, onProgressChanged: EventEmitter<number>): Observable<void> {
    seed = this.getCleanSeed(seed);
    const currentSeed = convertAsciiToHexa(seed);

    return this.unlockWalletAddresses(currentSeed, wallet, 0, onProgressChanged)
      .map((res: boolean) => {
        if (!res) {
          throw new Error(this.translate.instant('service.wallet.wrong-seed'));
        }

        wallet.seed = seed;
      });
  }

  saveWallets() {
    if (!environment.production) {
      const strippedWallets: Wallet[] = [];
      this.wallets.value.forEach(wallet => {
        const strippedAddresses: Address[] = [];
        wallet.addresses.forEach(address => strippedAddresses.push({ address: address.address }));
        strippedWallets.push({ coinId: wallet.coinId, needSeedConfirmation: wallet.needSeedConfirmation, label: wallet.label, addresses: strippedAddresses });
      });
      localStorage.setItem('wallets', JSON.stringify(strippedWallets));
    }

    this.wallets.next(this.wallets.value);
  }

  private loadWallets() {
    if (!environment.production) {
      const storedWallets: string = localStorage.getItem('wallets');
      if (storedWallets) {
        const wallets: Wallet[] = JSON.parse(storedWallets);

        wallets.filter(wallet => !wallet.coinId).forEach((wallet) => {
          wallet.coinId = defaultCoinId;
        });

        this.wallets.next(wallets);
      }
    } else {
      this.wallets.next([]);
    }
  }

  private getCleanSeed(seed: string): string {
    return seed.replace(/(\n|\r\n)$/, '');
  }

  private checkWalletAddresses(wallet: Wallet, lastIndexWithTxs: number, onProgressChanged: EventEmitter<ScanProgressData>, nextSeed: string): Observable<number> {
    const minAdrressesToScan = environment.e2eTest ? 2 : 10;
    const maxAdrressesToScan = environment.e2eTest ? 2 : 100;

    return this.addAddress(wallet, false)
      .flatMap(() => this.apiService.get('transactions', { addrs: wallet.addresses[wallet.addresses.length - 1].address }))
      .flatMap(transactions => {
        if (transactions && transactions.length > 0) {
          lastIndexWithTxs = wallet.addresses.length - 1;
          nextSeed = wallet.nextSeed;
        } else {
          wallet.nextSeed = nextSeed;
        }

        onProgressChanged.emit({
          addressesFound: lastIndexWithTxs + 1,
          progress: (wallet.addresses.length - 1 - lastIndexWithTxs) / minAdrressesToScan * 100
        });

        if (lastIndexWithTxs + minAdrressesToScan === wallet.addresses.length - 1 || wallet.addresses.length === maxAdrressesToScan) {
          return Observable.of(lastIndexWithTxs);
        } else {
          return this.checkWalletAddresses(wallet, lastIndexWithTxs, onProgressChanged, nextSeed);
        }
      });
  }

  private unlockWalletAddresses(currentSeed: string, wallet: Wallet, index: number, onProgressChanged: EventEmitter<number>): Observable<boolean> {
    return this.cipherProvider.generateAddress(currentSeed)
      .flatMap((response: GenerateAddressResponse) => {
        if (response.address.address !== wallet.addresses[index].address) {
          onProgressChanged.emit(0);
          return Observable.of(false);
        }

        onProgressChanged.emit((index + 1) / wallet.addresses.length * 100);
        wallet.nextSeed = response.nextSeed;
        wallet.addresses[index].public_key = response.address.public_key;
        wallet.addresses[index].secret_key = response.address.secret_key;
        index++;

        if (index === wallet.addresses.length) {
          return Observable.of(true);
        }

        return this.unlockWalletAddresses(response.nextSeed, wallet, index, onProgressChanged);
      });
  }
}
