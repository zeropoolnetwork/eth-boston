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
    const w = window as any;

    const hashedUtxo = (await this.web3.kovan.getAllAddUtxoEvents()).map(x => w.BigInt(x));
    console.log("leafs", hashedUtxo);

    const ecryptedUtxo = await this.web3.kovan.getAllAddEcryptedUtxoMessageEvents();

    const pvk = w.HDWallet
      .Privkey("shiver box little burden auto early shine vote dress symptom plate certain course open rely",
        "m/44'/0'/0'/0/0"
      );

    // todo: check outputs for unspent
    const ownerOutputs = this.findOwnerOutputs(ecryptedUtxo, pvk.k);
    console.log(`Owner outputs`, ownerOutputs);

    const amountToWithdrawal = w.BigInt(this.amount * 1e18); // need amount from frontend input
    console.log(`Amount to withdrawal: ${amountToWithdrawal}`);

    const toAddress = w.hexToBigInt(this.address)[0];
    // const toAddress = w.snarkUtils.randrange(0n, 1n << 160n);
    console.log(`To Address: ${toAddress}`);

    w.getWithdrawalData({
      privateKey: pvk.k,
      proverKey: w.pk,
    }, {
      receiver: toAddress,
      amount: amountToWithdrawal,
    }, {
      ownerUtxo: ownerOutputs,
      hashedUtxo: hashedUtxo
    }, w.txsString)
      .then(x => {
        const data = w.prepareWithdrawalDataToPushToSmartContract(x);

        // console.table(data);
        const [publicInputs, proof, cyphertext1, cyphertext2] = data;

        console.table({ publicInputs, proof, cyphertext1, cyphertext2 });

        this.web3.kovan.withdrawal(publicInputs, proof, cyphertext1, cyphertext2).then((txHash) => {
          console.log(`Transaction hash: ${txHash}`);
        });
      });

  }
}
