function getDepositData(assetId, amount, owner, transactionJSON, proverKey, privateKey, publicKey) {
  return new Promise((resolve, reject) => {
    const u = snark.utxo(assetId, amount, owner, uidRandom());
    const { inputs, add_utxo } = snark.depositCompute({ asset: snark.utxoToAsset(u), owner: u.owner });
    const cyphertext = Crypto.encrypt(add_utxo.map(snark.utxoInputs)[0], privateKey, publicKey);
    snarkUtils.proof(inputs, transactionJSON, proverKey)
      .then(sn => {
        resolve({snark: sn, cyphertext: cyphertext})
      })
  });
}

function linearize_proof(proof) {
  const result = Array(8);
  result[0] = proof.pi_a[0];
  result[1] = proof.pi_a[1];

  result[2] = proof.pi_b[0][1];
  result[3] = proof.pi_b[0][0];
  result[4] = proof.pi_b[1][1];
  result[5] = proof.pi_b[1][0];

  result[6] = proof.pi_c[0];
  result[7] = proof.pi_c[1];

  return result;
}

function prepareDataToPushToSmartContract(data) {
  const proof = linearize_proof(data.snark.proof);
  const publicInputs = data.snark.publicSignals;
  const cyphertext = bigIntArrayToHex(data.cyphertext);
  return [[...publicInputs], [...proof], "0x" + cyphertext]
}

function bigIntArrayToHex(data) {
  const arrayOfBuffers = appendBuffer(data.map(x => BigInt.leInt2Buff(x, 32)));
  return toHexString(arrayOfBuffers);
}

function appendBuffer(buffers) {
  const bytesCount = buffers.map(x => x.byteLength).reduce((x, acc) => acc += x);
  const tmp = new Uint8Array(bytesCount);
  for (let i = 0; i < buffers.length; i++) {
    tmp.set(new Uint8Array(buffers[i]), 32 * i);
  }
  return tmp;
}

const toHexString = bytes =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

// utxos - all outputs from smart contract events
// utxoToAsset - two indexes of withdrawal utxos
function getWithdrawalData(privateKey, proverKey, transactionJSON, /*array*/utxos, /*array*/mp_path, receiver, amount) {
  const merkleTree = getState(utxos);
  const mp_sibling = mp_path.map(e => merkleTree.proof(e));
  const asset = utxos[mp_path[0]].assetId + ((amount / 2n) << 16n);
  const root = merkleTree.root;
  const utxo_in = mp_path.map(i => utxos[i]);

  let res = snark.withdrawalPreCompute({ asset, receiver, utxo_in, mp_sibling, mp_path, root });
  res = snark.addSignatures(privateKey, res);
  const { inputs } = snark.withdrawalCompute(res);
  return snarkUtils.proof(inputs, transactionJSON, proverKey);
}

function getState(/*array*/utxoHashes) {
  const proofLength = 30;
  const mtree = new tree.MerkleTree(proofLength + 1);
  utxoHashes.forEach(u => mtree.push(snark.utxoHash(u)));
  return mtree;
}

const uidRandom = () => snarkUtils.randrange(0n, 1n << 253n);
