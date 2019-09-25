import { Component, OnInit } from '@angular/core';
import { Web3Service } from "../web3.service";

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.css']
})
export class WithdrawComponent implements OnInit {
  amount: number;
  address: string;

  constructor(private web3: Web3Service) {
  }

  async ngOnInit(): Promise<void> {
    this.withdrawal();
  }


  findOwnerOutputs(encryptedOutputs: string[], privateKey: any) {
    const w = window as any;
    encryptedOutputs = encryptedOutputs.map(x => w.hexToBigInt(x));
    const pbk = w.snarkUtils.pubkey(privateKey);
    console.log(`Public key: ${pbk}`);

    const ownerOutputs = {};
    encryptedOutputs.forEach((encryptedUtxo, i) => {
      try {
        const decryptedOutput = w.Crypto.decrypt(encryptedUtxo, pbk, privateKey);
        if (decryptedOutput[2] === pbk) {
          ownerOutputs[i] = w.snark.utxo(...decryptedOutput);
        }
      } catch (e) {
        // ignore
      }
    });
    return ownerOutputs;
  }

  async withdrawal() {
    const hashedUtxo = await this.web3.kovan.getAllAddUtxoEvents();
    const ecryptedUtxo = await this.web3.kovan.getAllAddEcryptedUtxoMessageEvents();
  console.log(hashedUtxo);
    const w = window as any;
    const pvk = w.HDWallet
      .Privkey("shiver box little burden auto early shine vote dress symptom plate certain course open rely",
        "m/44'/0'/0'/0/0"
      );

    const ownerOutputs = this.findOwnerOutputs(ecryptedUtxo, pvk.k);

    const amountToWithdrawal = 1000000000000000n; // need amount from frontend input
    console.log(`Amount to withdrawal: ${amountToWithdrawal}`);

    // const toAddress = w.hexToBigInt("0x7253c920a947F74e4361aF52521FA6cc686Ff8f4")[0];
    const toAddress = w.snarkUtils.randrange(0n, 1n << 160n);
    console.log(`To Address: ${toAddress}`);

    w.getWithdrawalData({
      privateKey: pvk.k,
      proverKey: w.pk,
    }, {
      receiver: toAddress,
      amount: amountToWithdrawal,
    }, {
      ownerUtxo: ownerOutputs,
      hashedUtxo: hashedUtxo.map(x => w.BigInt(x))
    }, w.txsString)
      .then(x => {
        const data = w.prepareWithdrawalDataToPushToSmartContract(x);

        // console.table(data);
        const [publicInputs, proof, cyphertext1, cyphertext2] = data;
        console.table({ publicInputs, proof, cyphertext1, cyphertext2 });
        debugger
        this.web3.kovan.withdrawal(publicInputs, proof, cyphertext1, cyphertext2).then((txHash) => {
          console.log(`Transaction hash: ${txHash}`);
        });
      });

  }

  withdraw() {
    console.log(this.amount, this.address);
  }
}
