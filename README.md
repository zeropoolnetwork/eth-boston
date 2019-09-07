# ETH Denver AnonymotyPool

## Preparing to generate the UTXO 
1. A pair of keys is generated on the custom curve (next `PubKey` and `PvtKey`) 

## The generation algorithm UTXO 
**Data:**  
1. `AssetId` - token's ID. 
2. `Amount` - new UTXO sum. 
3. `UtxoId` - 253 bit number (random). This will be the "salt" (identifier) of the new output. 
4. `PubKey` (*look at "Preparing to generate the UTXO"*) 

**Process** 
1. `NewLeaf` = PedersenHash(`AssetID, Amount, PublicKey, UtxoID`) 
2. `Cyphertext` - encrypt(`AssetID, Amount, PubKey, UtxoID`, `PubKey`). 

## Public data provided to Snark 
1. Deposit: 0x0, else `RootHash` 
2. Deposit: 0x0, else `Nullifier1` 
3. Deposit: 0x0, else `Nullifier2` 
4. `NewLeaf` (*look at  "The generation algorithm UTXO"*) 
5. `Asset`   
    а) Deposit: 16bit(assetId) + (64bit(amount) * 2^16)    
    б) Withrawal: 16bit(assetId) + (64bit(amount) * 2^16)     
    c) Transfer: `NewLeaf` of the second UTXO     
6. `OperationId`    
    a) Deposit: `0x0`    
    б) Withrawal: `0x1+receiver`, where receiver is a ETH address for withdrawal.     
    с) Transfer: `0x2` .   
    
## Push UTXO to smart contract
**Data:** 
1. `SnarkProof` - 8 x uint256, generated on frontend (*look at "Public data provided to Snark"*)
2. 6 public data provided to Snark (*look at "Public data provided to Snark"*)
3. `Cyphertext` (*look at  "The generation algorithm UTXO"*)

**Process**
1. Data is sent to the smart contract.

## Smart contract
1. Proof verification.
2. Using `NewLeaf` and `right merkle proof` generates `RootHash`
3. Call Deposit || Withdrawal || Transfer.

`NewLeaf` - emit event
`Cyphertext` emit event
`RootHash` - to storage

# Deposit 
1. Choose `AssetId`
2. Enter `Amount`
3. Generate `UtxoId`
4. "*Preparing to generate the UTXO*"
5. "*The generation algorithm UTXO*"
6. Push data to smart contract

`SnarkProof` not stored anywhere, it is inserted into the verifyProof function on the smart contract, to check that was actually used PedersenHash


# Withdrawal
1. Get `Cyphertext` events.
2. The User inserts `PvtKey`.
3. Those events (`INPUT`), which turned out to decipher, displayed to the user on the screen. He chooses one or two that he wants to withdraw. If one is selected, it is duplicated.
4. Enter `Amount` to withdrawal.
5. Enter ETH `Address` for withdrawal
6. If `Amount` < sum(`Amount` in UTXO), than generate`OUTPUT`, else zero `OUTPUT`.
7. (*look at "Push UTXO to smart contract"*)
8. Push data to smart contract

`SnarkProof` not stored anywhere, it is inserted into the verifyProof function on the smart contract to verify that all inputs of the new transaction belong to the sender.

