include "../node_modules/circomlib/circuits/merkleproofmimc.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/ecvrfpedersen.circom";
include "../node_modules/circomlib/circuits/mimc.circom";
include "../node_modules/circomlib/circuits/eddsa2mimc.circom";
include "utxo.circom";

template transaction(n) {
  signal input root;
  signal input n1;
  signal input n2_or_u_in;
  signal input out_u1;
  signal input out_u2_or_asset;
  signal input txtype;

  signal private input mp_sibling[2][n]; 
  signal private input mp_path[2]; 
  signal private input utxo_in[2][4];
  signal private input ecvrf[2][2]; // c, s
  signal private input utxo_out[2][4];
  signal private input eddsa[2]; //R, S

  component txtype_bits = Num2Bits(162);
  txtype_bits.in <== txtype;

  signal txflag[4]; // Deposit, Withdrawat, Transfer, TransferAtomicSwap

  var b0=txtype_bits.out[160];
  var b1=txtype_bits.out[161];
  txflag[3] <== b0 * b1;  
  txflag[0] <== txflag[3] + 1 - b0 - b1;  
  txflag[1] <== - txflag[3] + b0;  
  txflag[2] <== - txflag[3] + b1;  

  root*txflag[0] === 0;
  n1*txflag[0] === 0;
  n2_or_u_in*txflag[0] === 0;

  for(var i=0; i<n; i++) {
    mp_sibling[0][i]*txflag[0] === 0;
    mp_sibling[1][i]*(txflag[0]+txflag[3]) === 0;
  }

  for(var i=0; i<4; i++) {
    utxo_in[0][i]*txflag[0] === 0;
    utxo_in[1][i]*txflag[0] === 0;
    utxo_out[1][i]*(txflag[0]+txflag[1]) === 0;
  }

  ecvrf[0][0]*txflag[0] === 0;
  ecvrf[0][1]*txflag[0] === 0;
  ecvrf[1][0]*txflag[0] === 0;
  ecvrf[1][1]*txflag[0] === 0;

  eddsa[0]*txflag[0] === 0;
  eddsa[1]*txflag[0] === 0;
  
  
  component asset_bits = Num2Bits(80);
  asset_bits.in <== out_u2_or_asset * (txflag[0] + txflag[1]);

  component assetId = Bits2Num(16);
  for(var i=0; i<16; i++) {
    assetId.in[i] <== asset_bits.out[i];
  }

  component assetAmount = Bits2Num(64);
  for(var i=0; i<64; i++) {
    assetAmount.in[i] <== asset_bits.out[i+16];
  }

  component txtype_hash = Pedersen(162);
  for(var i=0; i<162; i++) {
    txtype_hash.in[i] <== txtype_bits.out[i];
  }


  component utxo_in_hash[2];
  utxo_in_hash[0]=utxo();
  utxo_in_hash[0].in[0]<==utxo_in[0][0] + (assetId.out - utxo_in[0][0])*txflag[0];
  utxo_in_hash[0].in[1]<==utxo_in[0][1] + (assetAmount.out - utxo_in[0][1])*txflag[0];
  utxo_in_hash[0].in[2]<==utxo_in[0][2];
  utxo_in_hash[0].in[3]<==utxo_in[0][3];

  utxo_in_hash[1]=utxo();
  for(var i=0; i<4; i++){
    utxo_in_hash[1].in[i] <== utxo_in[1][i];
  }



  component sameInputs = IsZero();
  sameInputs.in <== utxo_in_hash[0].out - utxo_in_hash[1].out;


  (utxo_in[0][2] - utxo_in[1][2])*(txflag[2]+txflag[3]) === 0;
  var Q = utxo_in_hash[0].in[2];

  component mp_path_bits[2];
  component merkleproof[2];
  
  for(var j=0; j<2; j++) {
    mp_path_bits[j] = Num2Bits(n);
    mp_path_bits[j].in <== mp_path[j];
    merkleproof[j]=merkleproofmimc(n);
    merkleproof[j].leaf <== utxo_in_hash[j].out;
    for(var i=0; i<n; i++) {
      merkleproof[j].sibling[i] <== mp_sibling[j][i];
      merkleproof[j].path[i] <== mp_path_bits[j].out[i];
    }
  }

  (merkleproof[0].root-root)*(txflag[1]+txflag[2]+txflag[3]) === 0;
  (merkleproof[1].root-root)*(txflag[1]+txflag[2]) === 0;
  (n2_or_u_in - utxo_in_hash[1].out)*txflag[3] === 0;



  component utxo_out_hash[2];

  utxo_out_hash[0]=utxo();
  for(var i=0; i<4; i++){
    utxo_out_hash[0].in[i]<==utxo_out[0][i];
  }

  utxo_out_hash[1]=utxo();
  utxo_out_hash[1].in[0]<==utxo_out[1][0] + (assetId.out - utxo_out[1][0]) * txflag[1];
  utxo_out_hash[1].in[1]<==utxo_out[1][1] + (assetAmount.out - utxo_out[1][1])* txflag[1];
  utxo_out_hash[1].in[2]<==utxo_out[1][2] - utxo_out[1][2]*txflag[1];
  utxo_out_hash[1].in[3]<==utxo_out[1][3] - utxo_out[1][2]*txflag[1];

  

  out_u1 - utxo_out_hash[0].out === 0;
  (out_u2_or_asset - utxo_out_hash[1].out) * (txflag[2] + txflag[3]) === 0;


  component ecvrf1 = ecvrfpedersen();
  ecvrf1.Q <== Q;
  ecvrf1.gamma <== n1;
  ecvrf1.c <== ecvrf[0][0];
  ecvrf1.s <== ecvrf[0][1];
  ecvrf1.alpha <== utxo_in_hash[0].in[3];
  ecvrf1.enabled <== txflag[1]+txflag[2]+txflag[3];

  component ecvrf2 = ecvrfpedersen();
  ecvrf2.Q <== Q;
  ecvrf2.gamma <== n2_or_u_in;
  ecvrf2.c <== ecvrf[1][0];
  ecvrf2.s <== ecvrf[1][1];
  ecvrf2.alpha <== utxo_in_hash[1].in[3] + (eddsa[0] - utxo_in_hash[1].in[3])*sameInputs.out;  // Use EDDSA_R as message for 2nd nonce for same inputs case.
  ecvrf2.enabled <== txflag[1]+txflag[2];

  component txhash = MultiMiMC7(5, 91);
  txhash.in[0] <== utxo_in_hash[0].out;
  txhash.in[1] <== utxo_in_hash[1].out;
  txhash.in[2] <== utxo_out_hash[0].out;
  txhash.in[3] <== utxo_out_hash[1].out;
  txhash.in[4] <== txtype_hash.out[0];
  txhash.k <== 0;

  component signverifier = eddsa2mimc();
  signverifier.Q <== Q;
  signverifier.m <== txhash.out;
  signverifier.R <== eddsa[0];
  signverifier.S <== eddsa[1];
  signverifier.enabled <== txflag[1]+txflag[2]+txflag[3];
  





  component sameAssets = IsZero();
  sameAssets.in <== utxo_in_hash[0].in[0] - utxo_in_hash[1].in[0];


  signal sameAssetsDifferentInputs;
  sameAssetsDifferentInputs <== sameAssets.out - sameInputs.out*sameAssets.out;

  (utxo_out_hash[0].in[0] - utxo_out_hash[1].in[0])*sameAssets.out === 0;

  utxo_in_hash[0].in[0] === utxo_out_hash[0].in[0];
  utxo_in_hash[1].in[0] === utxo_out_hash[1].in[0];

  (utxo_in_hash[0].in[1] - utxo_out_hash[0].in[1] - utxo_out_hash[1].in[1])*sameInputs.out === 0;
  (utxo_in_hash[0].in[1] + utxo_in_hash[1].in[1] - utxo_out_hash[0].in[1] - utxo_out_hash[1].in[1])*sameAssetsDifferentInputs === 0;

  (utxo_in_hash[0].in[1] - utxo_out_hash[0].in[1])*(1-sameAssets.out) === 0;
  (utxo_in_hash[1].in[1] - utxo_out_hash[1].in[1])*(1-sameAssets.out) === 0;

}

component main = transaction(30);