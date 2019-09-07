import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss']
})
export class ImportComponent implements OnInit {

  constructor(private router: Router) {

  }

  mnemonic = "";

  ngOnInit() {
  }

  generateWallet() {
    this.mnemonic = (window as any).Bip39.generateMnemonic();
  }

  importWallet() {
    const privateKey = (window as any).HDWallet.Privkey(this.mnemonic, "m/44'/0'/0'/0/0");
    console.log(privateKey);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
