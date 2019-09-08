import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.css']
})
export class ImportComponent implements OnInit {

  mnemonic = "habit this awkward muscle seven omit fiction walnut finger first frown make";

  constructor(private router: Router) {

  }

  ngOnInit() {
  }

  generateWallet() {
    this.mnemonic = (window as any).Bip39.generateMnemonic();
  }

  importWallet() {
    const privateKey = (window as any).HDWallet.Privkey(this.mnemonic, "m/44'/0'/0'/0/0");
    // privateKey
    console.log(privateKey);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
