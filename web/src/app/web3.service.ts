import { Injectable } from '@angular/core';
import { Web3Provider } from "./web3provider";
import abi from "../abi";

//const ganacheAddress = "0x9d0d5854dF00a9428804f337b3ADc127575ec2F3";

const kovanAddress = "0x3F77585D766a6BfD612d083751b70891852b9765";
// const kovanAddress = "0x6C6181d33C10758fdd4deDa4F096e7eDDEf6F0DB";
// const kovanAddress = "0x0621F15E560D0822150b98dCeaad5A3d55D3A362";
//const kovanAddress = "0xd4B615113347ec15D51BCF8F862B4Cea7BF47b8F";
// const kovanAddress = "0x74D375d80866FB5Ff8B32f11B344c278e65D2451";
//const kovanAddress = "0x4261AF65FD95b8B0168b56Bf413A7b75ce088ecf";

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

  kovan: Web3Provider;

  constructor() {
    this.kovan = new Web3Provider(abi, kovanAddress);
  }
}
