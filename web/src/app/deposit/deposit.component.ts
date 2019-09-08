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
      [0n, 0n, 0n, 7461938101573865025336198937497852588488962400046457889594172176390273464711n, 115640696307712n, 0n],
      [17757113050397816207157086469539545980273293743818672387664446045589961512297n,
        15119557871238364811841913178560497515135860866182533313187386256047228449581n,
        3084986607693544195821432180099524805912099973442646979738778944759663990265n,
        1857862730159408699911743621133185485089614293905524883460924026139082198166n,
        9397236337684862563906571790577901606456563502116110491996772151465664820601n,
        2504630172230932941722321914566567435940061266731509631877011096057339774970n,
        16168864848686836018421406127715271371882249964439733132764020071452762977407n,
        14450983056367581593197799012496956756166573465700697798733639696957041159080n
      ],
      "0x76811b80fa1654e248394614170bc5ef573674f32d4cea30db4456cce23c4805541b9ae2fb276335529df927b97f11cc256aea66ec017455d17573217809f216fa5c92ea0e4603d1aec3db96ec8cc97a1c2296178b7fc50441083be4a216920a69a9a929d83f7bc49cadd16f99651dc6f7c31a65f2b7eba4bd55c5012362b0214c84102ccaeabb1f484be14e9e730099ec3cd0e37310772fd154477f58a55a2b"]

    // this.web3.kovan.deposit(x[0] as any, x[1] as any, x[2] as any, "10000000000000000");
    this.web3.kovan.deposit(x[0] as any, x[1] as any, x[2] as any, "1764536992");
  }
}
