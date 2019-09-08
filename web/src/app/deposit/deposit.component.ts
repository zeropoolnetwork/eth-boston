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

    // (window as any).getDepositData(
    //   assetId,
    //   amount,
    //   publicKeyOwner,
    //   (window as any).txsString,
    //   (window as any).pk,
    //   publicKeyOwner,
    //   pvk.k
    // ).then(a => console.log((window as any).prepareDataToPushToSmartContract(a)));

    const x = [
      ["0", "0", "0", "17981154498750172978372286749327917263021132467224211184219841534738922813251", "115640702795776", "0"],
      ["19401879389858792557255776498584561943475705888242969095893545745020229832325",
        "20977691401380117421585345984085538177892197054044680171778085849503777666869",
        "8164509837802316127271553491006526060549436721332597102906866051058627297730",
        "6139520133441693423780034275199489279762156607821032181728428780047928227583",
        "13100936674977422875037536033444745318365314500730868259141354706884659599364",
        "1350900751280604576328623460828246853478782416675295273096219479836551568227",
        "4613873928729256544789457974788460395885780150335480007041353108458696895517",
        "16458642258240480962990130786433582019293068181688654735088031023722615825810"
      ],
      "0xd169267228dbbddaa7c4c94e3f6eaa33ba48002ec30514648cd20bfd649d522ab57b9088b6a32dc9e2f4ed1cb89edaf72985d927723b3ddcf389e07136eea61b3b90ed3b530d3c0e93ad44b2e1f39f4db1069a23927112b2026e6d554cd45f15829a63e90f50258477539e05dca688c80ac113d9fa719fb51687b260b036ee3177493210b68f5d519c9f8f2ccf997528c832e5b0cb05bcec7b9f7a5fdcc6c529"]

    this.web3.kovan.deposit(x[0] as any, x[1] as any, x[2] as any, "1764536992");
  }
}
