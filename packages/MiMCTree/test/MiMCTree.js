
const MiMCTree = artifacts.require('MiMCTree');
const MiMC = artifacts.require('MiMC');





contract('MiMC hash test', (accounts) => {
  let mimctree;
  beforeEach(async () => {
    const mimc = await MiMC.new();
    await MiMCTree.link(MiMC, mimc.address);
    mimctree = await MiMCTree.new();
  });

  it("Should compute single MiMC hash", async () => {
    console.log((await mimctree.test('1', '2')).toString());
  });

  it("Should add items to the tree", async () => {
    await mimctree.testPush(['1', '2', '3']);
    console.log((await mimctree.merkleRoot()).toString());
  });

})