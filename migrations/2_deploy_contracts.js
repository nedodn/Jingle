const Motif = artifacts.require("./contracts/Motif.sol");
const MotifProxy = artifacts.require("./contracts/MotifProxy.sol");


module.exports = function(deployer) {
  deployer.deploy(Motif);
  deployer.deploy(MotifProxy);
};
