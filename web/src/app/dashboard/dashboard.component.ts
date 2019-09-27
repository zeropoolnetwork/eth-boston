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

    this.getPrivateBalance()
      .then(balance => {
        this.balance = Number(balance) / 1e18; // todo: make it safe
      });

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

  async getPrivateBalance() {
    const w = window as any;

    const hashedUtxo = (await this.web3.kovan.getAllAddUtxoEvents()).map(x => w.BigInt(x));
    console.log("leafs", hashedUtxo);

    const nullifiers = await this.web3.kovan.getAllAddNullifierEvents();

    const ecryptedUtxo = await this.web3.kovan.getAllAddEcryptedUtxoMessageEvents();

    const pvk = w.HDWallet
      .Privkey("shiver box little burden auto early shine vote dress symptom plate certain course open rely",
        "m/44'/0'/0'/0/0"
      );

    const ownerOutputs = this.findOwnerOutputs(ecryptedUtxo, pvk.k);
    const balance = this.calculateUnspentBalance(pvk.k, Object.values(ownerOutputs), nullifiers);
    return balance;
  }

  private calculateUnspentBalance(pvk: any, outputs: any, nullifiers: any) {
    const m =  outputs.map(x => {
      const currentNullifier = (window as any).snark.utxoVRF(pvk, x);
      if (nullifiers.indexOf(currentNullifier) !== -1)
        return 0;
      return x.amount
    });
    if (m.length === 0) {
      return 0;
    }
    return m.reduce((acc, x) => acc += x)
  }

  private findOwnerOutputs(encryptedOutputs: string[], privateKey: any) {
    const w = window as any;
    encryptedOutputs = encryptedOutputs.map(x => w.hexToBigInt(x));
    const pbk = w.snarkUtils.pubkey(privateKey);
    console.log(`Public key: ${pbk}`);

    const ownerOutputs = {};
    encryptedOutputs.forEach((encryptedUtxo, i) => {
      try {
        const decryptedOutput = w.Crypto.decrypt(encryptedUtxo, pbk, privateKey);
        if (decryptedOutput[2] === pbk) {
          ownerOutputs[i] = w.snark.utxo(...decryptedOutput);
        }
      } catch (e) {
        // ignore
      }
    });
    return ownerOutputs;
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
