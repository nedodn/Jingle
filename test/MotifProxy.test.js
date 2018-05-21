var abi = require('ethereumjs-abi')

var MotifContractDefinition = artifacts.require('Motif.sol')
var MotifProxyContractDefinition = artifacts.require('MotifProxy.sol')
const BigNumber = web3.BigNumber

require('chai')
.use(require('chai-as-promised'))
.use(require('chai-bignumber')(BigNumber))
.should()

contract("MotifProxy", accounts => { 
  var owner = accounts[0]
  var secondUser = accounts[1]
  var motifProxy
  var motif 
  var min = new BigNumber(web3.toWei(.01, "ether"))
  
  beforeEach(async function () { 
    motif = await MotifContractDefinition.new({from: owner})
    motifProxy = await MotifProxyContractDefinition.new({ from: owner })

    const initializeData = encodeCall('initialize', ['address', 'uint256', 'address'], [owner, 64, secondUser])
    await motifProxy.upgradeToAndCall(motif.address, initializeData, { from: owner })
    
    motifProxy = await MotifContractDefinition.at(motifProxy.address)

    await motifProxy.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min })
    let x = await motifProxy.getMelody(1)
  })

  it('can upgrade', async function () { 
    let motifV2 = await MotifContractDefinition.new({from: owner})

    motifProxy = await MotifProxyContractDefinition.at(motifProxy.address)

    let currentImplementationAddress = await motifProxy.implementation()

    let MotifV1Address = motif.address
    let MotifV2Address = motifV2.address

    expect(currentImplementationAddress).to.equal(MotifV1Address);

    await motifProxy.upgradeTo(motifV2.address, { from: owner })
    
    currentImplementationAddress = await motifProxy.implementation()

    expect(currentImplementationAddress).to.not.equal(MotifV1Address);
    expect(currentImplementationAddress).to.equal(MotifV2Address);

    motifProxy = await MotifContractDefinition.at(motifProxy.address)

    let MotifOwner = await motifProxy.owner()
    MotifOwner.should.be.equal.owner

    let x = await motifProxy.getMelody(1)
    //console.log(x)
  })

  it('not owner can not upgrade', async function () { 
    let MotifV2 = await MotifContractDefinition.new({from: owner})

    motifProxy = await MotifProxyContractDefinition.at(motifProxy.address)

    let currentImplementationAddress = await motifProxy.implementation()

    let MotifV1Address = motif.address
    let MotifV2Address = MotifV2.address

    expect(currentImplementationAddress).to.equal(MotifV1Address);

    await expectThrow(motifProxy.upgradeTo(MotifV2.address, { from: secondUser }))
  })
})

var expectThrow = async promise => {
  try {
    await promise
  } catch (error) {
    // TODO: Check jump destination to destinguish between a throw
    //       and an actual invalid jump.
    const invalidOpcode = error.message.search('invalid opcode') >= 0
    // TODO: When we contract A calls contract B, and B throws, instead
    //       of an 'invalid jump', we get an 'out of gas' error. How do
    //       we distinguish this from an actual out of gas event? (The
    //       testrpc log actually show an 'invalid jump' event.)
    const outOfGas = error.message.search('out of gas') >= 0
    const revert = error.message.search('revert') >= 0
    assert(
      invalidOpcode || outOfGas || revert,
      'Expected throw, got \'' + error + '\' instead',
    )
    return
  }
  assert.fail('Expected throw not received')
}

var encodeCall = function(name, _arguments, values) {
  const methodId = abi.methodID(name, _arguments).toString('hex');
  const params = abi.rawEncode(_arguments, values).toString('hex');
  return '0x' + methodId + params;
}