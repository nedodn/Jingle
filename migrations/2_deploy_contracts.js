const Jingle = artifacts.require("./contracts/Jingle.sol");

module.exports = function(deployer) {
  deployer.deploy(Jingle);
};
