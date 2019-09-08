import { Component, OnInit } from '@angular/core';
import { WalletService } from "../wallet.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  subState: 'deposit' | 'withdraw' | 'transfer' | '' = '';
  isApproved = false;

  accountAddresses: any = [
    // {value: 1, label: '0x0000000000000000001'}
  ];

  assetAddresses: any = [
    // {value: 1, label: '0x0000000000000000002'}
  ];

  constructor(private wallet: WalletService) {
  }

  ngOnInit() {
    const publicKey = this.wallet.getPublicKey();
    this.accountAddresses = [
      {
        value: this.wallet.getPublicKey(),
        label: this.wallet.getAddress()
      },
    ];

    this.assetAddresses = [
      {
        value: 'ETH',
        label: 'ETH'
      },
      {
        value: 'ETH', // TODO: put token address  corresponding here
        label: 'WETH'
      },
    ];
  }

  approveAsset() {
    this.isApproved = true;
  }
}
