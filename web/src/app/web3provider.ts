export class Web3Provider {

  constructor(contractAbi: any, contractAddress: any) {
    // Unlock metamask
    (window as any).ethereum.enable();

    const eth = (window as any).web3.eth;
    const prepare = eth.contract(contractAbi);
    this.contractInstance = prepare.at(contractAddress);
    console.log(this.contractInstance.address);
    this.web3 = (window as any).web3;
  }

  readonly contractInstance: any;

  readonly web3: any;

  private static fromHexToString(hexString) {
    const hex = hexString.toString();
    let str = '';
    for (let n = 2; n < hex.length; n += 2) {
      const hexByte = hex.substr(n, 2);
      const num = parseInt(hexByte, 16);
      str += (num !== 0 ? String.fromCharCode(num) : '0');
    }
    return str;
  }

  public tbn(n) {
    return new this.web3.BigNumber(n);
  }

  public tw(n) {
    return this.tbn(n).mul(1e18).toString();
  }

  public fw(n) {
    return this.tbn(n).div(1e18).toString();
  }

  private isUnlocked = () => typeof this.web3.currentProvider !== 'undefined';

  public getAddress() {
    if (!this.isUnlocked()) {
      alert('Please, unlock your MetaMask account');
      throw new Error('Please, unlock your MetaMask account');
    }
    return this.web3.currentProvider.selectedAddress;
  }

  public getBalance(address: string): any {
    if (!this.isUnlocked()) {
      alert('Please, unlock your MetaMask account');
      throw new Error('Please, unlock your MetaMask account');
    }

    return new Promise((resolve, reject) => {
      this.web3.eth.getBalance(address, (err, balance) => {
        if (err) {
          reject(err);
        }
        resolve(balance.toString());
      });
    });
  }

  public sendTransaction(toAddress: any, amount: any, data: any = '') {
    return new Promise((resolve, reject) => {
      this.web3.eth.sendTransaction({
        to: toAddress,
        value: amount,
        data
      }, (err, txHash) => {
        if (err !== null) {
          reject(err);
        }
        resolve(txHash);
      });
    });
  }

  public callSmartContract(methodName: string) {
    return new Promise((resolve, reject) => {
      this.contractInstance[methodName].call((err, res) => {
        if (err) {
          reject(err);
        }
        resolve(Web3Provider.fromHexToString(res));
      });
    });
  }

  public sendSmartContract(methodName: string, parameters: any[] = [], value: string = '') {
    return new Promise((resolve, reject) => {
      this.contractInstance[methodName](...parameters, {value}, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
    });
  }

  public getCallData(methodName: string, parameters: any[] = []) {
    if (!this.contractInstance.methods[methodName]) {
      throw new Error(`Method ${methodName} does not exist`);
    }
    return this.contractInstance.methods[methodName](...parameters).encodeABI();
  }

  public deposit(input: any[], proof: any[], encdata1: any[], value: string) {
    // debugger
    return this.sendSmartContract("deposit", [input, proof, encdata1], value);
  }

  public withdrawal(input: any[], proof: any[], encdata1: any[], encdata2: any[], value: string) {
    return this.sendSmartContract("withdrawal", [input, proof, encdata1, encdata2], value)
  }

  public transfer(input: any[], proof: any[], encdata1: any[], encdata2: any[], value: string) {
    return this.sendSmartContract("transfer", [input, proof, encdata1, encdata2], value)
  }

  // public getAllAddUtxoEvents() {
  //   return new Promise((resolve, reject) => {
  //     this.contractInstance.AddUtxo((res, err) => {
  //       if (err) {
  //         reject(err);
  //       }
  //       resolve(res);
  //     });
  //   });
  // }
  //
  // public getAllAddEcryptedUtxoMessage() {
  //   return new Promise((resolve, reject) => {
  //     this.contractInstance.AddEcryptedUtxoMessage((res, err) => {
  //       if (err) {
  //         reject(err);
  //       }
  //       resolve(res);
  //     });
  //   });
  // }
}
