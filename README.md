A user can create a single base melody and stores it as an ERC721 token. The melody is then run through keccak256 in order to get a hash of the melody's data i.e. pitches, durations, and starting times. The melody must be sent to the contract already sorted and formatted correctly, which we take care of on the client side. We store the data in a format that checks the melody across keys, if you write your melody in C, you will still 'own' that melody in D or F#. Users may also combine other people's melodies with their own in order to create larger, more complex compositions by paying a composition price decided by a melody's owner. Composers are incentivized to write quality, unique melodies in order to get other people to use them in their own compositions. Users will also be able to choose a melody to represent themselves on the blockchain as an avatar, similar to EthMoji.

## To Run
Download the project

Run `npm start`

Navigate to http://localhost:30420

The current contracts are located on the Rinkeby Test Network so in order to use you must have Metamask connected to the Rinkeby Network


## Building

- `npm run build` build App.js
- `truffle migrate --reset` for local development
