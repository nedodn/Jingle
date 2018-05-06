const Jingle = artifacts.require("./contract/Jingle.sol");

module.exports = function(deployer) {
  deployer.deploy(Jingle, {gas: 6721975});
};
