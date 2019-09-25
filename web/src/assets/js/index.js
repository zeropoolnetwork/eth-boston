function getDepositData(assetId, amount, transactionJSON, proverKey, privateKey) {
  const owner = snarkUtils.pubkey(privateKey);

  return new Promise((resolve, reject) => {
    const u = snark.utxo(assetId, amount, owner);
    const { inputs, add_utxo } = snark.depositCompute({ asset: snark.utxoToAsset(u), owner: u.owner });
    const cyphertext = Crypto.encrypt(add_utxo.map(snark.utxoInputs)[0], owner, privateKey);
    snarkUtils.proof(inputs, transactionJSON, proverKey)
      .then(sn => {
        resolve({ snark: sn, cyphertext: cyphertext })
      })
      .catch((e) => {
        reject(e);
      })
  });
}

function getWithdrawalData({ privateKey, proverKey },
                           { receiver, amount },
                           { /*object*/ownerUtxo, /*array*/hashedUtxo },
                           transactionJSON) {
  const owner = snarkUtils.pubkey(privateKey);

  const { utxo_in } = Object.values(ownerUtxo).reduce((acc, x) => {
    if (acc.amount >= amount)
      return acc;

    acc.amount = acc.amount.add(x.amount);
    acc.utxo_in.push(x);
    return acc;
  }, { utxo_in: [], amount: 0n });

  const mp_path = Object.keys(ownerUtxo).map(x => Number(x)).slice(0, utxo_in.length);
  if (utxo_in.length === 1 && mp_path.length === 1) {
    utxo_in.push(utxo_in[0]);
    mp_path.push(mp_path[0]);
  }

  // todo: should mp_path === 2, should utxo_in === 2

  const asset = utxo_in[0].assetId + ((amount) << 16n);

  const { mp_sibling, root } = getProof(hashedUtxo, mp_path);

  return new Promise((resolve, reject) => {
    let res = snark.withdrawalPreCompute({ asset, receiver, utxo_in, mp_sibling, mp_path, root });
    res = snark.addSignatures(privateKey, res);
    const { inputs } = snark.withdrawalCompute(res);
    const cyphertext1 = Crypto.encrypt(inputs.utxo_out[0], owner, privateKey);
    const cyphertext2 = Crypto.encrypt(inputs.utxo_out[1], owner, privateKey);
    snarkUtils.proof(inputs, transactionJSON, proverKey)
      .then(sn => {
        resolve({ snark: sn, cyphertext1: cyphertext1, cyphertext2: cyphertext2 })
      })
      .catch((e) => {
        reject(e);
      })
  });
}

function getProof(/*array*/hashedUtxo, /*array*/mp_path) {
  const merkleTree = getState(hashedUtxo);
  const mp_sibling = mp_path.map(e => merkleTree.proof(e));
  const root = merkleTree.root;
  return {
    mp_sibling,
    root
  }
}


function getState(/*array*/utxos) {
  const proofLength = 30;
  const mtree = new tree.MerkleTree(proofLength + 1);
  utxos.forEach(u => {
    return mtree.push(u)
  });
  return mtree;
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

function prepareWithdrawalDataToPushToSmartContract(data) {
  const proof = linearize_proof(data.snark.proof);
  const publicInputs = data.snark.publicSignals;
  const cyphertext1 = bigIntArrayToHex(data.cyphertext1);
  const cyphertext2 = bigIntArrayToHex(data.cyphertext2);
  return [[...publicInputs], [...proof], "0x" + cyphertext1, "0x" + cyphertext2]
}

function hexToBigInt(data) {
  const buffer = hexToByteArray(data);
  return buffer.map(x => BigInt.leBuff2int(x))
}

function hexToByteArray(data) {
  if (data.indexOf("0x") === 0)
    data = data.substr(2);
  const fullBytes = fromHexString(data);
  const countOfArraysToSplit = fullBytes.byteLength / 32;
  const finalArray = [];
  for (let i = 0; i < countOfArraysToSplit; i++)
    finalArray.push(fullBytes.slice(i * 32, (i + 1) * 32));
  return finalArray;
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

const fromHexString = hexString =>
  new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const uidRandom = () => snarkUtils.randrange(0n, 1n << 253n);
