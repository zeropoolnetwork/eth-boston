import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  subState: 'deposit' | 'withdraw' | 'transfer' | '' = '';
  isApproved = false;

  constructor() {
  }

  ngOnInit() {
  }

  approveAsset() {
    this.isApproved = true;
  }
}
