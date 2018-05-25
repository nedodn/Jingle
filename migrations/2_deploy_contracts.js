const Motif = artifacts.require("./contracts/Motif.sol");
const MotifProxy = artifacts.require("./contracts/MotifProxy.sol");
const Auction = artifacts.require("./contracts/AuctionInstance.sol");

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
      await instance2.composeBaseMelody([100, 102, 104, 96], [0, 4, 8, 12], [16, 16, 16, 16], min, 40, 'First', { value: min })
      let x = await instance2.getMelody(1);
      console.log(x);

      deployer.deploy(Auction, instance2.address).then(async (instance3) => {
        await instance2.approve(instance3.address, 1);
        await instance3.createAuction(1, min);
        
        let test = await instance3.getAuction(1);
        console.log(test);
      })
    })
  })
};
