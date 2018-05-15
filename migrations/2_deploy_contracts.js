const Jingle = artifacts.require("./contracts/Jingle.sol");
const JingleProxy = artifacts.require("./contracts/JingleProxy.sol");


module.exports = function(deployer) {
  deployer.deploy(Jingle);
  deployer.deploy(JingleProxy);
};
