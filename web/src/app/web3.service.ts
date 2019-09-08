import { Injectable } from '@angular/core';
import { Web3Provider } from "./web3provider";
import abi from "../abi";

const kovanAddress = "0xd4B615113347ec15D51BCF8F862B4Cea7BF47b8F";

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

  kovan: Web3Provider;

  constructor() {
    this.kovan = new Web3Provider(abi, kovanAddress);
  }
}
