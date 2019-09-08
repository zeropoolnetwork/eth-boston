import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  private mnemonic: string;

  constructor() {
  }

  setMnemonic(mnemonic: string) {
    this.mnemonic = mnemonic;
  }

  getPrivateKey(): any {
    return (window as any).HDWallet.Privkey(this.mnemonic, "m/44'/0'/0'/0/0");
  }

  getPublicKey(): any {
    const publicKey = (window as any).HDWallet.Pubkey(this.mnemonic, "m/44'/0'/0'/0/0");
    return 'zp:' + publicKey.K[0].toString();
  }

}
