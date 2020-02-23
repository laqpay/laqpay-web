import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { WalletService } from './wallet/wallet.service';

@Injectable()
export class WizardGuardService implements CanActivate {
  constructor(
    private walletService: WalletService,
    private router: Router,
  ) {
  }

  canActivate(next: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return new Promise<boolean>((resolve, reject) => {
      this.walletService.haveWallets.subscribe(result => {
        if (!result) {
          this.router.navigate(['/wizard']);
          return resolve(false);
        }
        return resolve(true);
      });
    });
  }
}
