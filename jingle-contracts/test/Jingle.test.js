require('babel-polyfill')

const getAccounts = require('./helpers/getAccounts')
const ether = require('./helpers/ether')
const Jingle = artifacts.require('Jingle.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('Jingle', (accounts) => {
    beforeEach(async () => {
        const accounts = await getAccounts(web3)
    
        Jingle = await Jingle.new()
        await Jingle.initialize(accounts[0], 64, accounts[0])
    })

    it('should let you create a Base Melody', async () => {
        let id = await Jingle.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4, 5], [1, 1, 1, 1, 1], ether(0.01), { value: ether(0.01) })
        console.log(id)
    })
})