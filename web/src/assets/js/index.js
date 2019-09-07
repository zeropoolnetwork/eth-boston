function getDepositData(assetId, amount, owner, transactionJSON, proverKey) {
  const u = snark.utxo(assetId, amount, owner, uidRandom());
  const { inputs } = snark.depositCompute({ asset: snark.utxoToAsset(u), owner: u.owner });
  return snarkUtils.proof(inputs, transactionJSON, proverKey);
}

// utxos - all outputs from smart contract events
// utxoToAsset - two indexes of withdrawal utxos
function getWithdrawalData(proverKey, transactionJSON, /*array*/utxos, /*array*/utxoIndexes, receiverAddress, amount) {
  const merkleTree = getState(utxos);
  const mp_sibling = utxoIndexes.map(e => merkleTree.proof(e));
  const asset = utxos[utxoIndexes[0]].assetId + ((amount / 2n) << 16n);
  const root = merkleTree.root;
  const utxo_in = utxoIndexes.map(i => utxos[i]);

  let res = snark.withdrawalPreCompute({ asset, receiverAddress, utxo_in, mp_sibling, utxoIndexes, root });
  res = snark.addSignatures(proverKey, res);
  const { inputs } = snark.withdrawalCompute(res);
  return snarkUtils.proof(inputs, transactionJSON, proverKey);
}

function getState(/*array*/utxoHashes) {
  const proofLength = 30;
  const tree = new tree.MerkleTree(proofLength + 1);
  utxoHashes.forEach(u => tree.push(snark.utxoHash(u)));
  return tree;
}

const uidRandom = () => snarkUtils.randrange(0n, 1n << 253n);
