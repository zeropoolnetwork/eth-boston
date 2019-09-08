import { Injectable } from '@angular/core';

const defaultPath = "m/44'/0'/0'/0/0";

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  // private mnemonic: string;
  private _mnemonic: string;
  get mnemonic(): string {
    return localStorage.getItem('mnemonic');
  }

  set mnemonic(value: string) {
    localStorage.setItem('mnemonic', value);
  }

  constructor() {
  }

  getPrivateKey(path: string = defaultPath): any {
    return (window as any).HDWallet.Privkey(this.mnemonic, defaultPath);
  }

  getPublicKey(path: string = defaultPath): any {
    const publicKey = (window as any).HDWallet.Pubkey(this.mnemonic, defaultPath);
    return publicKey.K[0];
  }

  getAddress(): any {
    const x = `zp:${this.getPublicKey()}`;
    return `zp:${this.getPublicKey()}`;
  }

}
