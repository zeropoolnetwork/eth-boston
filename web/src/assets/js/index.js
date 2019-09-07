function getDepositData(assetId, amount, owner, transactionJSON, prooverKey) {
  const u = snark.utxo(assetId, amount, owner, uidRandom());
  const { inputs } = snark.depositCompute({ asset: snark.utxoToAsset(u), owner: u.owner });
  return snarkUtils.proof(inputs, transactionJSON, prooverKey);
}

const uidRandom = () => snarkUtils.randrange(0n, 1n << 253n);
