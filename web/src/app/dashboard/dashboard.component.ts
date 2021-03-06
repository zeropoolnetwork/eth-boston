import { Component, OnInit } from '@angular/core';
import { WalletService } from "../wallet.service";
import { Web3Service } from "../web3.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  subState: 'deposit' | 'withdraw' | 'transfer' | '' = '';
  isApproved = false;

  assetId = 'ETH';
  publicKey = '';

  accountAddresses: any = [
    // {value: 1, label: '0x0000000000000000001'}
  ];

  assetAddresses: any = [
    // {value: 1, label: '0x0000000000000000002'}
  ];
  balance: any = 0;

  constructor(private wallet: WalletService, private web3: Web3Service) {
  }

  ngOnInit() {
    this.publicKey = this.wallet.getPublicKey();
    this.accountAddresses = [
      {
        value: this.publicKey,
        label: this.wallet.getAddress()
      },
      {
        value: this.wallet.getPublicKey("m/44'/0'/0'/0/1"),
        label: this.wallet.getAddress("m/44'/0'/0'/0/1")
      },
      // {
      //   value: this.wallet.getPublicKey("m/44'/0'/0'/0/2"),
      //   label: this.wallet.getAddress("m/44'/0'/0'/0/2")
      // },
    ];

    // const pubKey = this.publicKey;
    // const w = window as any;
    // setInterval(() => {
    //   const wei = this.web3.kovan.getBalance(pubKey).then( () => {
    //     this.balance = this.web3.kovan.fw(wei);
    //     console.log('balance=', this.web3.kovan.fw(wei));
    //   });
    // }, 10000);

    // WETH addresses
    //
    // Mainnet: 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
    // Kovan: 0xd0a1e359811322d97991e03f863a0c30c2cf029c
    // Ropsten: 0xc778417e063141139fce010982780140aa0cd5ab
    // Rinkeby: 0xc778417e063141139fce010982780140aa0cd5ab

    this.assetAddresses = [
      {
        value: 'ETH',
        label: 'ETH'
      },
      {
        value: '0xd0a1e359811322d97991e03f863a0c30c2cf029c', // TODO: put token address  corresponding here
        label: 'WETH'
      },
    ];
  }

  approveAsset() {
    this.isApproved = true;
  }

  updatePublicKey(value: string) {
    this.publicKey = value;
  }

  updateAssetId(value: string) {
    this.assetId = value;
  }
}
