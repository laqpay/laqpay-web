import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';
import { TemplateRef, Injectable } from '@angular/core';
import { ComponentType } from '@angular/cdk/overlay';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class CustomMatDialogService extends MatDialog {

  get showingDialog(): Observable<boolean> {
    return this.dialogsDisplayed.asObservable().map(value => value !== 0);
  }

  private dialogsDisplayed: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  open<T, D>(componentOrTemplateRef: ComponentType<T> | TemplateRef<T>, config?: MatDialogConfig<D>, ignoreAppStyle?: boolean): MatDialogRef<T, any> {
    if (!ignoreAppStyle) {
      if (!config) {
        config = new MatDialogConfig();
      }
      config.panelClass = 'default-dialog-style';
    }

    this.dialogsDisplayed.next(this.dialogsDisplayed.value + 1);

    const result = super.open(componentOrTemplateRef, config);

    result.afterClosed().subscribe(() => this.dialogsDisplayed.next(this.dialogsDisplayed.value - 1));

    return result;
  }
}
