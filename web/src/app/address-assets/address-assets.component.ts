import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-address-assets',
  templateUrl: './address-assets.component.html',
  styleUrls: ['./address-assets.component.css']
})
export class AddressAssetsComponent implements OnChanges {

  @Input()
  accountAddressesList: Array<any> = [];

  @Input()
  assetAddressesList: Array<any> = [];

  selectedAddress = null;
  selectedAsset = null;

  constructor() {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes.accountAddressesList) {
      this.selectedAddress = changes.accountAddressesList.currentValue[0].label;
    }

    if (changes && changes.assetAddressesList) {
      this.selectedAsset = changes.assetAddressesList.currentValue[0].value;
    }
  }


}
