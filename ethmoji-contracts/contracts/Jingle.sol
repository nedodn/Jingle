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
    uint256 public constant MAXDURATION;
    uint256 public constant REGISTRAIONFEE;
    address beneficiary;
    uint256 fees;

    struct note {
        int8 pitch;
        uint256 startTime;
        uint256 duration;
    }

    struct Melody {
        note[] melody;
    }
    
    function initialize(address newOwner, uint256 maxDuration, address _beneficiary) public {
        require(!_initialized);
        isCompositionOnlyWithBaseLayers = true;
        REGISTRATIONFEE = .001 ether;
        MAXDURATION = maxDuration;
        beneficiary = _beneficary;
        owner = newOwner;
        _initialized = true;
        isCompositionOnlyWithBaseLayers = true;
    }

    /**
    * @dev Mints a base melody
    */
    function composeBaseMelody(int8[] pitches,  uint256[] startTimes, uint256[] durations, uint256 _compositionPrice, uint256 _changeRate,  bool _changeableCompPrice) public payable whenNotPaused returns(uint256) {
        require(pitches.length == startTimes.length == durations.length);
        //first pitch will always be 100 to keep track of pitch movements
        require(pitches[0] == 100);
        //make sure the last note does not go past the maximum length
        require(startTimes[startTimes.length-1] + durations[durations.length-1] <= MAXDURATION);
        //must pay registration fee
        require(msg.value >= REGISTRATIONFEE);

        Melody memory _melody;

        //variable to keep track of the last notes start time
        uint256 lastStart = 0;
        int8 lastPitch = 0;
        for (uint256 i = 0; i < pitches.length; ++i) {
            //make sure a later note does not come before a previous note - this is mostly for checking uniqueness rather than actual organization
            require(startTimes[i] >= lastStart);
            if (startTimes[i] == lastStart) {
                require(pitches[i] > lastPitch);
            }
            note memory _note = note({
                pitch: pitches[i], 
                startTime: startTimes[i], 
                duration: durations[i]
            });

            _melody.melody.push(_note);

            lastStart = startTimes[i];
            lastPitch = pitches[i];
        }

        //mint base melody
        uint256 _id = Composable.mintTo(msg.sender, _compositionPrice, _changeRate, _changeableCompPrice, keccack256(_melody));

        tokenIdToMelody[_id] = _melody;

        fees = fees.add(REGISTRATIONFEE);

        return _id;
    }

    function composeComposition(int8[] pitches,  uint256[] startTimes, uint256[] durations, uint256[] _tokenIds, uint256 _compositionPrice, uint256 _changeRate,  bool _changeableCompPrice, bytes32 _melodyHash) public payable whenNotPaused {
        //mint base melody with any added notes
        uint256 newId = composeBaseMelody(pitches, startTimes, durations, _compositionPrice, _changeRate, _changeableCompPrice);

        uint256[] memory newTokenIds = _tokenIds;
        newTokenIds.push(newId);

        //compose composition melody
        Composable.compose(newTokenIds, _melodyHash);

        // Immediately pay out to layer owners
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            _withdrawTo(ownerOf(_tokenIds[i]));
        }
    }

// ----- EXPOSED METHODS --------------------------------------------------------------------------

    /**
    * @dev returns the name Jingle
    * @return string Jingle
    */
    function name() public pure returns (string) {
        return NAME;
    }

    /**
    * @dev returns the name JING
    * @return string JING
    */
    function symbol() public pure returns (string) {
        return SYMBOL;
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

    function withdraw(address beneficiary) public onlyOwner {
        beneficiary.transfer(fees);
    }
}