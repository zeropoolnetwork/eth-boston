import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

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

  @Output()
  publicKeyChanged = new EventEmitter<string>();

  @Output()
  assetIdChanged = new EventEmitter<string>();

  selectedAddress: any = null;
  selectedAsset: any = null;

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

  accountChanged($event: any) {
    this.publicKeyChanged.emit($event.value);
  }

  assetChanged($event: any) {
    this.assetIdChanged.emit($event.value);
  }
}
