include "../node_modules/circomlib/circuits/pedersen.circom";
include "../node_modules/circomlib/circuits/bitify.circom";


template utxo() {
  signal input in[4];
  //signal input assetid;  //assetId 16 bit
  //signal input amount;   //amount  64 bit
  //signal input owner;    //owner   254 bit
  //signal input uid;      //uid     253 bit

  signal output out;

  component hasher = Pedersen(587);

  component assetid_bits = Num2Bits(16);
  assetid_bits.in <== in[0];


  for(var i = 0; i<16; i++) {
    hasher.in[i] <== assetid_bits.out[i];
  }

  component amount_bits = Num2Bits(64);
  amount_bits.in <== in[1];

  for(var i = 0; i<64; i++) {
    hasher.in[i+16] <== amount_bits.out[i];
  }

  component owner_bits = Num2Bits_strict();
  owner_bits.in <== in[2];

  for(var i = 0; i<254; i++) {
    hasher.in[i+80] <== owner_bits.out[i];
  }

  component uid_bits = Num2Bits(253);
  uid_bits.in <== in[3];

  for(var i = 0; i<253; i++) {
    hasher.in[i+334] <== uid_bits.out[i];
  }

  out <== hasher.out[0];

}