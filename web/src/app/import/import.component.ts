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
    this.wallet.mnemonic = this.mnemonic;
    this.router.navigate(['/dashboard']);
  }

  // goToDashboard() {
  //   this.router.navigate(['/dashboard']);
  // }
}
