import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SendLaqpayComponent } from './send-laqpay.component';
import { MockTranslatePipe, MockCoinService, MockNavBarService } from '../../../utils/test-mocks';
import { CoinService } from '../../../services/coin.service';
import { NavBarService } from '../../../services/nav-bar.service';

describe('SendLaqpayComponent', () => {
  let component: SendLaqpayComponent;
  let fixture: ComponentFixture<SendLaqpayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SendLaqpayComponent, MockTranslatePipe ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: CoinService, useClass: MockCoinService },
        { provide: NavBarService, useClass: MockNavBarService },
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SendLaqpayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
