import { Component, OnInit } from '@angular/core';
import { Web3Service } from "../web3.service";


@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.css']
})
export class DepositComponent implements OnInit {

  constructor(private web3: Web3Service) {

  }

  ngOnInit() {
  }

  deposit() {
    const pbk = (window as any).HDWallet
      .Pubkey("shiver box little burden auto early shine vote dress symptom plate certain course open rely",
        "m/44'/0'/0'/0/0"
      );

    const pvk = (window as any).HDWallet
      .Privkey("shiver box little burden auto early shine vote dress symptom plate certain course open rely",
        "m/44'/0'/0'/0/0"
      );

     const assetId = 99n;
     const amount = 1764536992n;
     const publicKeyOwner = pbk.K[0];

    (window as any).getDepositData(
      assetId,
      amount,
      publicKeyOwner,
      (window as any).txsString,
      (window as any).pk,
      publicKeyOwner,
      pvk.k
    ).then(a => console.log((window as any).prepareDataToPushToSmartContract(a)));

    // web3.kovan.deposit()
  }
}
