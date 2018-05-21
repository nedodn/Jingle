pragma solidity ^0.4.23;

import "./Composable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Motif
 * Motif - a contract to mint and compose original Motifs
*/
contract Motif is Composable {
    using SafeMath for uint256;

    // set proxy as the owner
    bool internal _initialized;

    uint256 public MAXDURATION;
    address beneficiary;
    uint256 fees;

    modifier checkArguments(int8[] pitches,  uint256[] startTimes, uint256[] durations) {
        require(pitches.length == startTimes.length && pitches.length == durations.length && pitches.length < 100);
        require (pitches[0] == 100);
        uint256 last = startTimes.length - 1;
        require(startTimes[last] + durations[last] <= MAXDURATION);
        _;
    }

    constructor() ERC721Token("Motif", "MOTIF") public {}
    
    function initialize(address newOwner, uint256 maxDuration, address _beneficiary) public {
        require(!_initialized);
        isCompositionOnlyWithBaseLayers = true;
        MAXDURATION = maxDuration;
        minCompositionFee = 0.01 ether;
        beneficiary = _beneficiary;
        owner = newOwner;
        _initialized = true;
    }

    /**
    * @dev Mints a base melody
    */
    function composeBaseMelody(int8[] pitches,  
                               uint256[] startTimes, 
                               uint256[] durations, 
                               uint256 _compositionPrice,
                               int8 _displayPitch,
                               bytes32 _title) checkArguments(pitches, startTimes, durations) public payable whenNotPaused {
        //must pay registration fee
        require(msg.value >= minCompositionFee);
        
        uint256 id = _getNextTokenId();
         createMelody(pitches, startTimes, durations, _compositionPrice, _displayPitch);
        tokenIdToTitle[id] = _title;

        fees = fees.add(minCompositionFee);
    }

    function composeComposition(int8[] pitches,  
                                uint256[] startTimes, 
                                uint256[] durations, 
                                uint256[] _tokenIds, 
                                uint256 _compositionPrice, 
                                int8[] _displayPitches,
                                bytes32 _melodyHash,
                                bytes32 _title) public payable whenNotPaused {
        //mint base melody with any added notes
        uint256 newId = _getNextTokenId();
        composeBaseMelody(pitches, startTimes, durations, _compositionPrice, _displayPitches[_displayPitches.length - 1], _title);

        uint256[] memory newTokenIds = new uint256[](_tokenIds.length + 1);
        
        for (uint256 i = 0; i < _tokenIds.length; ++i) {
            newTokenIds[i] = _tokenIds[i];
            tokenIdToDisplayPitch[newId].push(_displayPitches[i]);
        }
        newTokenIds[newTokenIds.length - 1] = newId;
        tokenIdToDisplayPitch[newId].push(_displayPitches[_displayPitches.length - 1]);

        //compose composition melody
        Composable.compose(newTokenIds, _melodyHash);
        tokenIdToTitle[newId] = _title;

        // Immediately pay out to layer owners
        for (uint256 x = 0; x < _tokenIds.length; x++) {
            _withdrawTo(ownerOf(_tokenIds[x]));
        }
    }

    function createMelody(int8[] pitches,  
                          uint256[] startTimes, 
                          uint256[] durations, 
                          uint256 _compositionPrice,
                          int8 _displayPitch) internal returns (uint256) {
        uint256 _id = _getNextTokenId();

        //variable to keep track of the last notes start time
        uint256 lastStart = 0;
        int8 lastPitch = 0;
        for (uint256 i = 0; i < pitches.length; ++i) {
            //make sure a later note does not come before a previous note - this is mostly for checking uniqueness rather than actual organization
            require(startTimes[i] >= lastStart);
            if (startTimes[i] == lastStart) {
                //make sure pitches with the same Start Time are sorted in ascending order
                if(lastPitch != 100) {
                    require(pitches[i] > lastPitch);
                }
            }
            int8 _pitch = pitches[i];
            uint256 _startTime = startTimes[i];
            uint256 _duration = durations[i];
            note memory _note = note({
                pitch: _pitch, 
                startTime: _startTime, 
                duration: _duration
            });

            tokenIdToMelody[_id].melody.push(_note);

            lastStart = startTimes[i];
            lastPitch = pitches[i];
        }

        bytes32 _melodyHash = keccak256(pitches, startTimes, durations);

        //mint base melody
        _id = Composable.mintTo(msg.sender, _compositionPrice, _melodyHash);
        tokenIdToDisplayPitch[_id].push(_displayPitch);

        return _id;
    }

// ----- EXPOSED METHODS --------------------------------------------------------------------------

    /**
    * @dev gets a melody for a composition
     */
    function getMelody(uint256 _id) public view returns (int8[], uint256[], uint256[]) {
        Melody storage melody = tokenIdToMelody[_id];

        int8[] memory _pitches = new int8[](melody.melody.length);
        uint[] memory _startTimes = new uint256[](melody.melody.length);
        uint256[] memory _durations = new uint256[](melody.melody.length);

        for (uint256 i = 0; i < melody.melody.length; ++i) {
            note memory _note = melody.melody[i];
            _pitches[i] = _note.pitch;
            _startTimes[i] = _note.startTime;
            _durations[i] = _note.duration;
        }

        return (_pitches, _startTimes, _durations);
    }

    /**
    * @dev returns whether or not a token id is a composition
     */
     function isAComposition(uint256 _id) public view returns (bool) {
         return (tokenIdToLayers[_id].length > 1);
     }

    /**
    * @dev gets display pitches
     */
     function getDisplayPitches(uint256 _id) public view returns (int8[]) {
         return tokenIdToDisplayPitch[_id];
     }

     /**
     * @dev gets a title
      */
      function getTitle(uint256 _id) public view returns (bytes32) {
          return tokenIdToTitle[_id];
      }

// ----- PRIVATE FUNCTIONS ------------------------------------------------------------------------

    /**
    * @dev withdraw accumulated balance to the payee
    * @param _payee address to which to withdraw to
    */
    function _withdrawTo(address _payee) private {
        uint256 payment = payments[_payee];

        if (payment != 0 && address(this).balance >= payment) {
            totalPayments = totalPayments.sub(payment);
            payments[_payee] = 0;
            _payee.transfer(payment);
        }
    }

    function withdraw() public onlyOwner {
        beneficiary.transfer(fees);
    }
}
