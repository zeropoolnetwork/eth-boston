import {Component, OnInit} from '@angular/core';
import {Web3Service} from "../web3.service";

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.css']
})
export class WithdrawComponent implements OnInit {

  constructor(private web3: Web3Service) {
  }

  ngOnInit() {
    this.withdrawal();
  }

  findOwnerOutputs(/*array*/encryptedOutputs, privateKey) {
    const w = window as any;

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

  withdrawal() {
    const w = window as any;

    const pvk = w.HDWallet
      .Privkey("shiver box little burden auto early shine vote dress symptom plate certain course open rely",
        "m/44'/0'/0'/0/0"
      );
    console.log(`Private key: ${pvk.k}`);

    const encryptedUtxo = w.hexToBigInt("27fc96c235b9409c23c6664282549eb5bfe14a9a56d61d54af1479c07390241642ffafaf" +
      "6c283c4c8c8ea71665ba7d7c3ab32ebf04f933f52af1850e432c2d28b8773e4c34595013e4b6d0601b8fa19e00f8e3c85e5df564a3e9" +
      "b5817edcee0caa2b2b6bd41ed115d6344b09ac7b22f7c4b16b0fa76856b565b8bbdabd223e205fbadcf58cead6246242ffe857d549681" +
      "981ee67b640ffd1bacfc3ec78fc8d34");
    console.log(`Encrypted utxo: ${encryptedUtxo}`);

    const readableUtxo = this.findOwnerOutputs([encryptedUtxo], pvk.k);
    console.log("Readable Utxo", readableUtxo);

    const amountToWithdrawal = readableUtxo["0"].amount; // need amount from frontend input
    console.log(`Amount to withdrawal: ${amountToWithdrawal}`);

    const toAddress = w.snarkUtils.randrange(0n, 1n << 160n);
    console.log(`To Address: ${toAddress}`);

    w.getWithdrawalData({
      privateKey: pvk.k,
      proverKey: w.pk,
    }, {
      receiver: toAddress,
      amount: amountToWithdrawal,
    }, {
      utxoToWithdrawal: readableUtxo,
      hashedUtxo: [w.snark.utxoHash(readableUtxo[0])]
    }, w.txsString)
      .then(x => {
        const data = w.prepareWithdrawalDataToPushToSmartContract(x);

        // console.table(data);
        const [publicInputs, proof, cyphertext1, cyphertext2] = data;
        console.table({publicInputs, proof, cyphertext1, cyphertext2});

        this.web3.kovan.withdrawal(publicInputs, proof, cyphertext1, cyphertext2).then((txHash) => {
          console.log(`Transaction hash: ${txHash}`);
        });
      });

  }

}
