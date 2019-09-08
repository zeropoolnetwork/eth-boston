import { Injectable } from '@angular/core';
import { Web3Provider } from "./web3provider";
import abi from "../abi";

const kovanAddress = "0xd4B615113347ec15D51BCF8F862B4Cea7BF47b8F";
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
