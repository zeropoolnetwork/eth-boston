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

  constructor(private wallet: WalletService) {
  }

  ngOnInit() {
    this.wallet.getPublicKey()
  }

  approveAsset() {
    this.isApproved = true;
  }
}
