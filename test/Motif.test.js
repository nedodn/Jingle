const Motif = artifacts.require('Motif.sol')
const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('Motif', (accounts) => {
    let min = new BigNumber(web3.toWei(.01, "ether"))
    let motif

    beforeEach(async () => {
        motif = await Motif.new()
        await motif.initialize(accounts[0], 64, accounts[0])
    })

    describe('Base Melodies', () => {
        it('should let you create a Base Melody', async () => {
            await motif.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min }).should.be.fulfilled
        })
        it('but not without 100 as the first pitch', async () => {
            await motif.composeBaseMelody([10, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol',  { value: min }).should.be.rejected
        })
        it('or with uneven arrays', async () => {
            await motif.composeBaseMelody([100, 2, 4, -2, 0, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min }).should.be.rejected
        })
        it('or going past the max length', async () => {
            await motif.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 63], [1, 1, 1, 1, 2], min, 40, 'lol', { value: min }).should.be.rejected
        })
        it('cannot copy an already existing Melody', async () => {
            await motif.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min }).should.be.fulfilled
            await motif.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min }).should.be.rejected
        })
        it('arrays must be sorted', async () => {
            await motif.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 2], [1, 1, 1, 1, 2], min, 40, 'lol', { value: min }).should.be.rejected
            await motif.composeBaseMelody([100, 2, 1, -2, -4], [0, 0, 0, 3, 2], [1, 1, 1, 1, 2], min, 40, 'lol', { value: min }).should.be.rejected
        })
    })

    describe('minting a base token', () => {
        let tx;
        let tokenId;
        let compositionPrice;
    
        it('emits correct log', async function () { 
          tx = await motif.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min }).should.be.fulfilled
          tx.logs[0].event.should.be.equal('Transfer')
    
          tx.logs[1].event.should.be.equal('BaseTokenCreated')
          tx.logs[2].event.should.be.equal('CompositionPriceChanged')
        })
    
        it('sets one layer (itself)', async function () { 
          tx = await motif.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min }).should.be.fulfilled
          tokenId = tx.logs[0].args._tokenId;
    
          const layers = await motif.getTokenLayers(tokenId)  
          layers.length.should.be.equal(1)
          layers[0].toNumber().should.be.equal(tokenId.toNumber())
        })
    
        it('sets correct owner (owner)', async function () { 
          tx = await motif.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min }).should.be.fulfilled
          tokenId = tx.logs[0].args._tokenId;
    
          const tokenOwner = await motif.ownerOf(tokenId)
          tokenOwner.should.be.equal(accounts[0])
        })
    
        it('sets correct initial composition price', async function () { 
          tx = await motif.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min }).should.be.fulfilled
          tokenId = tx.logs[0].args._tokenId;
    
          compositionPrice = await motif.getCompositionPrice(tokenId)    
          compositionPrice.toNumber().should.be.equal(min.toNumber())
        })
    
        it('updates uniqueness', async function () { 
          tx = await motif.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min }).should.be.fulfilled
          tokenId = tx.logs[0].args._tokenId;
    
          var isValidComposition = await motif.isValidComposition([tokenId], web3.sha3([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1]))
          isValidComposition.should.be.false
        })
    })

    describe('Composition minting', () => {
        beforeEach(async () => {
            await motif.composeBaseMelody([100, 2, 4, -2, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min })
            await motif.composeBaseMelody([100, 4, 7, 11, -4], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min })
            await motif.composeBaseMelody([100, 3, 6, -2, -4], [0, 1, 2, 3, 4], [1, 30, 1, 1, 1], min, 40, 'lol', { value: min })
            await motif.composeBaseMelody([100, -3, 2, 4, 5, 1, 0, 3, 4, 6, -25], [0, 0, 0, 0, 0, 1, 2, 3, 4, 6, 8], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], min, 40, 'lol', { value: min })
            await motif.composeBaseMelody([100, 2, 4, -2, -2], [0, 1, 2, 3, 4], [1, 1, 1, 1, 1], min, 40, 'lol', { value: min })
        })

        it('should let you create a composition', async () => {
            await motif.composeComposition([100], [1], [2], [1, 2, 3, 4, 5], min, [40, 41, 42, 43, 44],  web3.sha3('hash'), 'lol', { value: (min * 7) } ).should.be.fulfilled
            let layers = await motif.getTokenLayers.call(5);
            console.log(layers.length)
            let x = await motif.getDisplayPitches.call(6);
            //console.log(x)
        })

        it('cannot copy a composition', async () => {
            await motif.composeComposition([100], [1], [2], [1, 2, 3, 4, 5], min, web3.sha3('hash'), 'lol', { value: (min * 7) } ).should.be.fulfilled
            await motif.composeComposition([100], [1], [2], [1, 2, 3, 4, 5], min, web3.sha3('hash'), 'lol', { value: (min * 7) } ).should.be.rejected
            await motif.composeComposition([100], [1], [3], [1, 2, 3, 4, 5], min, web3.sha3('hash'), 'lol', { value: (min * 7) } ).should.be.rejected
        })
    })
})
