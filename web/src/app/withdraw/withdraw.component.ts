import {Component, OnInit} from '@angular/core';
import { Web3Service } from "../web3.service";

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.css']
})
export class WithdrawComponent implements OnInit {

  constructor(private web3: Web3Service) {
  }

  ngOnInit() {
    this.withdrawal()
  }

  withdrawal() {
    const w = window as any;

    const pvk = w.HDWallet
      .Privkey("shiver box little burden auto early shine vote dress symptom plate certain course open rely",
        "m/44'/0'/0'/0/0"
      );
    const pbk = w.snarkUtils.pubkey(pvk.k);

    console.log(`Private key: ${pvk}`);
    console.log(`Public key: ${pbk}`);

    let encryptedUtxo = w.hexToBigInt("27fc96c235b9409c23c6664282549eb5bfe14a9a56d61d54af1479c07390241642ffafaf6c283c4c8c8ea71665ba7d7c3ab32ebf04f933f52af1850e432c2d28b8773e4c34595013e4b6d0601b8fa19e00f8e3c85e5df564a3e9b5817edcee0caa2b2b6bd41ed115d6344b09ac7b22f7c4b16b0fa76856b565b8bbdabd223e205fbadcf58cead6246242ffe857d549681981ee67b640ffd1bacfc3ec78fc8d34");
    console.log(`Encrypted utxo: ${encryptedUtxo}`);

    let decryptedUtxo = w.Crypto.decrypt(encryptedUtxo, pbk, pvk.k);
    console.log("Decrypted utxo");
    console.log(decryptedUtxo);

    let readableUtxo = w.snark.utxo(decryptedUtxo[0], decryptedUtxo[1], decryptedUtxo[2], decryptedUtxo[3]);
    console.log("Readable utxo");
    console.log(readableUtxo);

    const amountToWithdrawal = readableUtxo.amount;
    console.log(`Amount to withdrawal: ${amountToWithdrawal}`);

    const toAddress = w.snarkUtils.randrange(0n, 1n << 160n);
    console.log(`To Address: ${toAddress}`);

    const mp_path = 0;
    console.log(`mp_path: ${mp_path}`);

    w.getWithdrawalData(pvk.k, w.pk, w.txsString, [readableUtxo, readableUtxo], [mp_path, mp_path], toAddress, amountToWithdrawal)
      .then(x => {
        const data = w.prepareWithdrawalDataToPushToSmartContract(x);

        const publicInputs = data[0];
        console.log("Public inputs");
        console.log(publicInputs);
        const proof = data[1];
        console.log("Proof");
        console.log(proof);
        const cyphertext1 = data[2];
        console.log(`Cyphertext1: ${cyphertext1}`);
        const cyphertext2 = data[3];
        console.log(`Cyphertext2: ${cyphertext2}`);

        this.web3.kovan.withdrawal(publicInputs, proof, cyphertext1, cyphertext2).then((txHash) => {
          console.log(`Transaction hash: ${txHash}`);
        });
      });

  }

}
