import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { WalletService } from "../wallet.service";

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.css']
})
export class ImportComponent {

  mnemonic = "habit this awkward muscle seven omit fiction walnut finger first frown make";

  constructor(private router: Router, private wallet: WalletService) {
  }

  // generateWallet() {
  //   this.mnemonic = (window as any).Bip39.generateMnemonic();
  // }

  importWallet() {
    // const publicKey = (window as any).HDWallet.Pubkey(this.mnemonic, "m/44'/0'/0'/0/0");
    // const x = 'zp:' + publicKey.K[0].toString();
    this.wallet.setMnemonic(this.mnemonic);
    this.router.navigate(['/dashboard']);
  }

  // goToDashboard() {
  //   this.router.navigate(['/dashboard']);
  // }
}
