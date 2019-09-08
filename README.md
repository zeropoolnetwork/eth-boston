# Anonymous Pool

Description of cryptographic primitives, used here - https://ethresear.ch/t/some-snarky-tricks-from-ethboston-zeropool-under-the-hood/6115 or below.

*Disclaimer: This is a very experimental project, and the components described here is strongly unrecommended to use in production without further research.*

Video:
- https://youtu.be/fU8WTTzrRYA
- https://youtu.be/FE37_hiV4kQ

## Cryptography primitives 

### Fast elliptic point compression for the subgroup

Public and private keys are used at twisted Edwards snark-friendly curve babyJubJub


![](https://latex.codecogs.com/gif.latex?a%20x%5E2%20&plus;%20y%5E2%20%3D%201%20&plus;%20d%20x%5E2%20y%5E2),


where all equations are carried out at field $F_p$, where $p$ is point order for BN254. $a = 168700$, $d = 168696$.

Curve order for babyJubJub is $8q$, where $q$ is 251bit prime number.


The addition rule for the curve is

![](https://latex.codecogs.com/gif.latex?%28x_1%2C%20y_1%29%20&plus;%20%28x_2%2C%20y_2%29%20%3D%20%5Cfrac%7Bx_1%20y_2%20&plus;%20y_1%20x_2%7D%7B1&plus;d%20x_1%20x_2%20y_1%20y_2%7D%20&plus;%20%5Cfrac%7By_1%20y_2%20-%20a%20x_1%20x_2%7D%7B1-d%20x_1%20x_2%20y_1%20y_2%7D.)

This mean that 

![](https://latex.codecogs.com/gif.latex?%28x%2C%20y%29%20&plus;%20%28x%2C%20-y%29%20%3D%20%280%2C%20-1%29).

`(0, -1)` is not in `F_q` subgroup and points `(x, y)` and `(x, -y)` cannot be at subgroup both.

It is enough to store only first coordinate $x$ to keep the public key and unpack the point when we need.

[Here](https://github.com/snjax/circomlib/blob/d1ad9cc8dc9a7b3f6a5b98f7b97c714064a3a1f6/circuits/pointbits.circom#L144) is implementation for point decompression. We use it at [eddsa](https://github.com/snjax/circomlib/blob/d1ad9cc8dc9a7b3f6a5b98f7b97c714064a3a1f6/circuits/eddsa2mimc.circom) and [ecvrf](https://github.com/snjax/circomlib/blob/d1ad9cc8dc9a7b3f6a5b98f7b97c714064a3a1f6/circuits/ecvrfpedersen.circom). This approach allows to use much lesser constraints to keep and hash the points.


### Nullifier computation via [ECVRF](https://github.com/snjax/circomlib/blob/d1ad9cc8dc9a7b3f6a5b98f7b97c714064a3a1f6/circuits/ecvrfpedersen.circom).

Each UTXO has a unique deterministic commitment to protect from double-spends. If this commitment is already published onchain, the contract reject the transaction.

It is important that nullifier is depended from the private key of the owner. That means that UTXO creator does not know the nullifier if he is not the owner and nobody can track when the UTXO is spent.

The naive way to compute the nullifier is using 
`N := hash(sk, utxoId)`, where `sk` is the private key and `utxoId` is a unique id for the UTXO.

But in this case, we need to keep `sk` and the same device as zkSNARK prover. Snarks computation is a heavy thing, so, it is not working for hardware wallets.

Another way is by using ECVRF. Here is the construction inside our solution:

#### Keys

`Y = x G`, where `G` is generator point, `Y` is public key and `x` is a private key.


#### Proof
```
H := Hash(Y, alpha)
Gamma := x H
k := nonce(x, H)
c := hash(H, Gamma, k G, k H)
s := (k+c x) mod q
return {Gamma, c, s}
```
Where nonce is determenistic pseudo-random function (we use one based on blake512 [here](https://github.com/snjax/circomlib/blob/d1ad9cc8dc9a7b3f6a5b98f7b97c714064a3a1f6/src/ecvrfpedersen.js#L19)), `Hash` is elliptic curve point hash function, `hash` is scalar hash function, `gamma` is deterministic verifiable commitment.

We use Pedersen hash for both cases. 

#### Verify
```
H := Hash(Y, alpha)
U := s G - c Y
V := s H - c Gamma
c == hash(H, Gamma, U, V)
```
Circom implementation is [here](https://github.com/snjax/circomlib/blob/d1ad9cc8dc9a7b3f6a5b98f7b97c714064a3a1f6/circuits/ecvrfpedersen.circom) and js implementation is [here](https://github.com/snjax/circomlib/blob/d1ad9cc8dc9a7b3f6a5b98f7b97c714064a3a1f6/src/ecvrfpedersen.js#L19).



## Workflow

### The generation algorithm UTXO 
**Data:**  
1. `AssetId` - token ID, 16 bit
2. `Amount` - amount of AssetId token with contract-defined multiplier 64 bit
3. `UtxoId` - 253 bit number (random). This will be the "salt" (identifier) of the new output. 
4. `PubKey` 

**Process** 
1. `NewLeaf` = PedersenHash(`AssetID, Amount, PublicKey, UtxoID`) 
2. `Cyphertext` - encrypt(utxo, receiverPubKey).

ChyperTexts are published to blockchain in calldata. User try to decrypt each Chypertext

### Data provided to zkSNARK

|          |    | Deposit       | Withdrawal          | Transfer      | AtomicSwap    |
|----------|----|---------------|---------------------|---------------|---------------|
| Public:  | 0  |               | root                | root          | root          |
|          | 1  |               | nullifier           | nullifier     | nullifier     |
|          | 2  |               | nullifier           | nullifier     | utxo_in_hash  |
|          | 3  | utxo_out_hash | utxo_out_hash       | utxo_out_hash | utxo_out_hash |
|          | 4  | asset         | asset               | utxo_out_hash | utxo_out_hash |
|          | 5  | 0x0           | (0x1<<160)+receiver | 0x2<<160      | 0x3<<160      |
| Private: | 35 |               | merkleprof          | merkleprof    | merkleprof    |
|          | 36 |               | merklepath          | merklepath    | merklepath    |
|          | 66 |               | merkleprof          | merkleprof    |               |
|          | 67 |               | merklepath          | merklepath    |               |
|          | 69 |               | ecvrf               | ecvrf         | ecvrf         |
|          | 71 |               | ecvrf               | ecvrf         | ecvrf         |
|          | 75 |               | utxo_input          | utxo_input    | utxo_input    |
|          | 79 |               | utxo_input          | utxo_input    | utxo_input    |
|          | 83 | utxo_output   | utxo_output         | utxo_output   | utxo_output   |
|          | 87 |               |                     | utxo_output   | utxo_output   |
|          | 89 | eddsa         | eddsa               | eddsa         | eddsa         |

All procedures are merged into one zkSNARK for better using optimized [batchGroth16Verifier](https://github.com/snjax/groth16batchverifier).
    
Merkle proofs are used to prove that we are spending one asset from the set of all assets. ECVRF-based nullifiers are used to protecting from double spends. 


# Bibliography

1. [S. Goldberg, L. Reyzin, D. Papadopoulos, J. Vcelak "Verifiable Random Functions (VRFs)"](https://tools.ietf.org/html/draft-irtf-cfrg-vrf-04)
1. [Maciej Ulas "Rational points on certain hyperelliptic curves over finite fields"](https://arxiv.org/pdf/0706.1448.pdf)

Thanks to Oleg Taraskin and Kobi Gurkan for links.


# Deployed contract

SKALE endpoint https://ethboston0.skalenodes.com:10216 contract 0x06f89a58BBC9Ed8fcCc7735adE681Ec211eCf004

https://rinkeby.etherscan.io/address/0x62f914ce7263867048997cc748d4646d45631695#code

https://kovan.etherscan.io/address/0xd4b615113347ec15d51bcf8f862b4cea7bf47b8f#code

