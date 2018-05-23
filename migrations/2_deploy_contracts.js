const Motif = artifacts.require("./contracts/Motif.sol");
const MotifProxy = artifacts.require("./contracts/MotifProxy.sol");

let abi = require('ethereumjs-abi');
let min = 10000000000000000;

var encodeCall = function(name,_arguments,values){
  const methodId = abi.methodID(name,_arguments).toString('hex');
  const params = abi.rawEncode(_arguments, values).toString('hex');
  return '0x' + methodId + params;
}


module.exports = function(deployer, network, accounts) {
  deployer.deploy(Motif).then(async (instance1) => {
    deployer.deploy(MotifProxy).then(async (instance2) => {
      let initializeData = encodeCall('initialize', ['address', 'uint256', 'address'], [accounts[0], 64, accounts[0]]);

      await instance2.upgradeToAndCall(instance1.address, initializeData, { from: accounts[0] });
      instance2 = Motif.at(instance2.address);
      await instance2.composeBaseMelody([100, 102, 104, 96, 93], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'First', { value: min })
      let x = await instance2.getMelody(1);
      console.log(x);
    })
  })
};
