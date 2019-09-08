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
    return (window as any).HDWallet.Privkey(this.mnemonic, path);
  }

  getPublicKey(path: string = defaultPath): any {
    const publicKey = (window as any).HDWallet.Pubkey(this.mnemonic, path);
    return publicKey.K[0];
  }

  getAddress(path: string = defaultPath): any {
    return `zp:${this.getPublicKey(path)}`;
  }

}
