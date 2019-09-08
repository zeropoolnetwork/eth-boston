import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-address-assets',
  templateUrl: './address-assets.component.html',
  styleUrls: ['./address-assets.component.css']
})
export class AddressAssetsComponent implements OnInit {

  selectedAddress = null;
  addresses = [
    {value: 1, label: '0x0000000000000000000'}
  ];

  selectedAssetAddress = null;
  assetAddress = [
    {value: 1, label: '0x0000000000000000000'}
  ];

  constructor() {

  }

  ngOnInit() {
    this.selectedAddress = this.addresses[0];
  }

}
