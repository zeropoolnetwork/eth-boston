const MiMCTree = artifacts.require('MiMCTree');
const { updateMimcArtifact } = require("../src/mimcgenerated.js");


module.exports = async function (deployer) {
  await updateMimcArtifact();
  const MiMC = artifacts.require('MiMC');
  await deployer.deploy(MiMC);
  await deployer.link(MiMC, MiMCTree);
  await deployer.deploy(MiMCTree);
};
