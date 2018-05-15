var abi = require('ethereumjs-abi')

var JingleContractDefinition = artifacts.require('Jingle')
var JingleProxyContractDefinition = artifacts.require('JingleProxy')
const BigNumber = web3.BigNumber

require('chai')
.use(require('chai-as-promised'))
.use(require('chai-bignumber')(BigNumber))
.should()

contract("JingleProxy", accounts => { 
  var owner = accounts[0]
  var secondUser = accounts[1]
  var JingleProxy
  var Jingle 
  var min = new BigNumber(web3.toWei(.01, "ether"))
  
  beforeEach(async function () { 
    Jingle = await JingleContractDefinition.new({from: owner})
    JingleProxy = await JingleProxyContractDefinition.new({ from: owner })

    const initializeData = encodeCall('initialize', ['address', 'uint256', 'address'], [owner, 64, secondUser])
    await JingleProxy.upgradeToAndCall(Jingle.address, initializeData, { from: owner })
    
    JingleProxy = await JingleContractDefinition.at(JingleProxy.address)

    await JingleProxy.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, { value: min })
    let x = await JingleProxy.getMelody(1)
  })

  it('can upgrade', async function () { 
    let JingleV2 = await JingleContractDefinition.new({from: owner})

    JingleProxy = await JingleProxyContractDefinition.at(JingleProxy.address)

    let currentImplementationAddress = await JingleProxy.implementation()

    let JingleV1Address = Jingle.address
    let JingleV2Address = JingleV2.address

    expect(currentImplementationAddress).to.equal(JingleV1Address);

    await JingleProxy.upgradeTo(JingleV2.address, { from: owner })
    
    currentImplementationAddress = await JingleProxy.implementation()

    expect(currentImplementationAddress).to.not.equal(JingleV1Address);
    expect(currentImplementationAddress).to.equal(JingleV2Address);

    JingleProxy = await JingleContractDefinition.at(JingleProxy.address)

    let JingleOwner = await JingleProxy.owner()
    JingleOwner.should.be.equal.owner

    let x = await JingleProxy.getMelody(1)
    console.log(x)
  })

  it('not owner can not upgrade', async function () { 
    let JingleV2 = await JingleContractDefinition.new({from: owner})

    JingleProxy = await JingleProxyContractDefinition.at(JingleProxy.address)

    let currentImplementationAddress = await JingleProxy.implementation()

    let JingleV1Address = Jingle.address
    let JingleV2Address = JingleV2.address

    expect(currentImplementationAddress).to.equal(JingleV1Address);

    await expectThrow(JingleProxy.upgradeTo(JingleV2.address, { from: secondUser }))
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