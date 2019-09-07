function getDepositData(assetId, amount, owner, transactionJSON, proverKey) {
  const u = snark.utxo(assetId, amount, owner, uidRandom());
  const { inputs } = snark.depositCompute({ asset: snark.utxoToAsset(u), owner: u.owner });
  return snarkUtils.proof(inputs, transactionJSON, proverKey);
}

// utxos - all outputs from smart contract events
// utxoToAsset - two indexes of withdrawal utxos
function getWithdrawalData(proverKey, transactionJSON, /*array*/utxos, /*array*/mp_path, receiver, amount) {
  const merkleTree = getState(utxos);
  const mp_sibling = mp_path.map(e => merkleTree.proof(e));
  const asset = utxos[mp_path[0]].assetId + ((amount / 2n) << 16n);
  const root = merkleTree.root;
  const utxo_in = mp_path.map(i => utxos[i]);

  let res = snark.withdrawalPreCompute({ asset, receiver, utxo_in, mp_sibling, mp_path, root });
  res = snark.addSignatures(BigInt.leBuff2int((new Blob([JSON.stringify(proverKey, null, 2)], {type : 'application/json'}))), res);
  const { inputs } = snark.withdrawalCompute(res);
  return snarkUtils.proof(inputs, transactionJSON, BigInt.leBuff2int((new Blob([JSON.stringify(proverKey, null, 2)], {type : 'application/json'}))));
}

function getState(/*array*/utxoHashes) {
  const proofLength = 30;
  const mtree = new tree.MerkleTree(proofLength + 1);
  utxoHashes.forEach(u => mtree.push(snark.utxoHash(u)));
  return mtree;
}

const uidRandom = () => snarkUtils.randrange(0n, 1n << 253n);
