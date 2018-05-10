pragma solidity ^0.4.21;

import "./Composable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Jingle
 * Jingle - a contract to mint and compose original jingles
*/
contract Jingle is Composable {
    using SafeMath for uint256;

    // set proxy as the owner
    bool internal _initialized;

    string public constant NAME = "Jingle";
    string public constant SYMBOL = "JING";
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
    function composeBaseMelody(int8[] pitches,  uint256[] startTimes, uint256[] durations, uint256 _compositionPrice) checkArguments(pitches, startTimes, durations) public payable whenNotPaused {
        //must pay registration fee
        require(msg.value >= minCompositionFee);

        createMelody(pitches, startTimes, durations, _compositionPrice);

        fees = fees.add(minCompositionFee);
    }

    function composeComposition(int8[] pitches,  uint256[] startTimes, uint256[] durations, uint256[] _tokenIds, uint256 _compositionPrice, bytes32 _melodyHash) public payable whenNotPaused {
        //mint base melody with any added notes
        uint256 newId = _getNextTokenId();
        composeBaseMelody(pitches, startTimes, durations, _compositionPrice);

        uint256[] memory newTokenIds = new uint256[](_tokenIds.length + 1);
        
        for (uint256 i = 0; i < _tokenIds.length; ++i) {
            newTokenIds[i] = _tokenIds[i];
        }
        newTokenIds[newTokenIds.length - 1] = newId;

        //compose composition melody
        Composable.compose(newTokenIds, _melodyHash);

        // Immediately pay out to layer owners
        for (uint256 x = 0; x < _tokenIds.length; x++) {
            _withdrawTo(ownerOf(_tokenIds[x]));
        }
    }

    function createMelody(int8[] pitches,  uint256[] startTimes, uint256[] durations, uint256 _compositionPrice) internal returns (uint256) {
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

        return _id;
    }

// ----- EXPOSED METHODS --------------------------------------------------------------------------

    /**
    * @dev returns the name Jingle
    * @return string Jingle
    */
    function name() public view returns (string) {
        return NAME;
    }

    /**
    * @dev returns the name JING
    * @return string JING
    */
    function symbol() public view returns (string) {
        return SYMBOL;
    }

    /**
    * @dev gets a melody for a composition
     */
    function getMelody(uint256 _id) external view returns (int8[] _pitches, uint256[] _startTimes, uint256[] _durations) {
        note[] memory melody = tokenIdToMelody[_id].melody;

        for (uint256 i = 0; i < melody.length; ++i) {
            _pitches[i] = melody[i].pitch;
            _startTimes[i] = melody[i].startTime;
            _durations[i] = melody[i].duration;
        }
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
