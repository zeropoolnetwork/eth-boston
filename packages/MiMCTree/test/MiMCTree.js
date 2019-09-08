const MiMCTree = artifacts.require('MiMCTree');
const MiMC = artifacts.require('MiMC');

// const { randrange, witness, pedersen, pubkey } = require("../../txcircuit/src/utils.js");
// const babyJub = require("circomlib/src/babyjub.js");

// const _ = require("lodash");
// const { utxoRandom, utxoHash, depositCompute, utxoToAsset, addSignatures,
//   withdrawalCompute, withdrawalPreCompute,
//   transferCompute, transferPreCompute,
//   transfer2Compute, transfer2PreCompute,
//   proofLength
// } = require("../../txcircuit/src/inputs.js")
// const { MerkleTree } = require("../../txcircuit/src/merkletree.js");

const input = ["0", "0", "0", "17981154498750172978372286749327917263021132467224211184219841534738922813251", "115640702795776", "0"];
const proof = ["19401879389858792557255776498584561943475705888242969095893545745020229832325",
  "20977691401380117421585345984085538177892197054044680171778085849503777666869",
  "8164509837802316127271553491006526060549436721332597102906866051058627297730",
  "6139520133441693423780034275199489279762156607821032181728428780047928227583",
  "13100936674977422875037536033444745318365314500730868259141354706884659599364",
  "1350900751280604576328623460828246853478782416675295273096219479836551568227",
  "4613873928729256544789457974788460395885780150335480007041353108458696895517",
  "16458642258240480962990130786433582019293068181688654735088031023722615825810"
];

const data = "0xd169267228dbbddaa7c4c94e3f6eaa33ba48002ec30514648cd20bfd649d522ab57b9088b6a32dc9e2f4ed1cb89edaf72985d927723b3ddcf389e07136eea61b3b90ed3b530d3c0e93ad44b2e1f39f4db1069a23927112b2026e6d554cd45f15829a63e90f50258477539e05dca688c80ac113d9fa719fb51687b260b036ee3177493210b68f5d519c9f8f2ccf997528c832e5b0cb05bcec7b9f7a5fdcc6c529";


contract('MiMC hash test', (accounts) => {
  let mimctree;
  beforeEach(async () => {
    const mimc = await MiMC.new();
    await MiMCTree.link(MiMC, mimc.address);
    mimctree = await MiMCTree.new();
  });

  it("Should process deposit", async () => {
    await mimctree.deposit(input, proof, data, { value: '1764536992' });
    //console.log((await mimctree.test('1', '2')).toString());
  });

  // it("Should compute single MiMC hash", async () => {
  //   console.log((await mimctree.test('1', '2')).toString());
  // });

  // it("Should add items to the tree", async () => {
  //   await mimctree.testPush(['1', '2', '3']);
  //   console.log((await mimctree.merkleRoot()).toString());
  // });

})
