pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/payment/PullPayment.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";


/**
 * @title Composable
 * Composable - a contract to mint compositions
 */

contract Composable is ERC721Token, Ownable, PullPayment, Pausable {
    // Max number of layers for a composition token
    uint public constant MAX_LAYERS = 10;
    // The minimum composition fee for a melody
    uint256 public minCompositionFee;

    struct note {
        int8 pitch;
        uint256 startTime;
        uint256 duration;
    }

    struct Melody {
        note[] melody;
    }

    // Mapping from token ID to composition price
    mapping (uint256 => uint256) public tokenIdToCompositionPrice;
    // Mapping from token ID to layers representing it
    mapping (uint256 => uint256[]) public tokenIdToLayers;
    // Hash of all layers to track uniqueness of melodys
    mapping (bytes32 => bool) public compositions;
    // Image hashes to track uniquenes of melody images.
    mapping (bytes32 => bool) public melodyHashes;

    mapping (uint256 => Melody) internal tokenIdToMelody;

    mapping (uint256 => int8[]) public tokenIdToDisplayPitch;

    mapping (uint256 => bytes32) internal tokenIdToTitle;

    // Event for emitting new base token created 
    event BaseTokenCreated(uint256 tokenId); 
    // Event for emitting new composition token created 
    event CompositionTokenCreated(uint256 tokenId, uint256[] layers, address indexed owner);
    // Event for emitting composition price changing for a token
    event CompositionPriceChanged(uint256 tokenId, uint256 price, address indexed owner);
    // Event for emitting composition price changing for a token
    event RoyaltiesPaid(uint256 tokenId, uint256 amount, address indexed owner);

    // Whether or not this contract accepts making compositions with other compositions
    bool public isCompositionOnlyWithBaseLayers;
    
// ----- EXPOSED METHODS --------------------------------------------------------------------------

    /**
    * @dev Mints a base token to an address with a given composition price
    * @param _to address of the future owner of the token
    * @param _compositionPrice uint256 composition price for the new token
    * @param _melodyHash uint256 hash of the resulting image
    */
    function mintTo(address _to, uint256 _compositionPrice, bytes32 _melodyHash) internal returns (uint256) {
        uint256 newTokenIndex = _getNextTokenId();
        _mint(_to, newTokenIndex);
        tokenIdToLayers[newTokenIndex] = [newTokenIndex];
        require(_isUnique(tokenIdToLayers[newTokenIndex], _melodyHash));
        compositions[keccak256([newTokenIndex])] = true;
        melodyHashes[_melodyHash] = true;      
        emit BaseTokenCreated(newTokenIndex);
        _setCompositionPrice(newTokenIndex, _compositionPrice);

        return newTokenIndex;
    }

    /**
    * @dev Mints a composition melody
    * @param _tokenIds uint256[] the array of layers that will make up the composition
    */
    function compose(uint256[] _tokenIds,  bytes32 _melodyHash) internal whenNotPaused {
        require(_tokenIds.length > 1);
        uint256 price = getTotalCompositionPrice(_tokenIds);
        require(msg.sender != address(0) && msg.value >= price);
        require(_tokenIds.length <= MAX_LAYERS);

        uint256[] memory layers = new uint256[](MAX_LAYERS);
        uint actualSize = 0; 

        for (uint i = 0; i < _tokenIds.length; i++) { 
            uint256 compositionLayerId = _tokenIds[i];
            require(_tokenLayersExist(compositionLayerId));
            uint256[] memory inheritedLayers = tokenIdToLayers[compositionLayerId];
            if (isCompositionOnlyWithBaseLayers) { 
                require(inheritedLayers.length == 1);
            }
            require(inheritedLayers.length < MAX_LAYERS);
            for (uint j = 0; j < inheritedLayers.length; j++) { 
                require(actualSize < MAX_LAYERS);
                for (uint k = 0; k < layers.length; k++) { 
                    require(layers[k] != inheritedLayers[j]);
                    if (layers[k] == 0) { 
                        break;
                    }
                }
                layers[actualSize] = inheritedLayers[j];
                actualSize += 1;
            }
            require(ownerOf(compositionLayerId) != address(0));
            asyncSend(ownerOf(compositionLayerId), tokenIdToCompositionPrice[compositionLayerId]);
            emit RoyaltiesPaid(compositionLayerId, tokenIdToCompositionPrice[compositionLayerId], ownerOf(compositionLayerId));
        }
    
        uint256 newTokenIndex = _getNextTokenId();
        
        tokenIdToLayers[newTokenIndex] = _trim(layers, actualSize);
        require(_isUnique(tokenIdToLayers[newTokenIndex], _melodyHash));
        compositions[keccak256(tokenIdToLayers[newTokenIndex])] = true;
        melodyHashes[_melodyHash] = true;
    
        _mint(msg.sender, newTokenIndex);

        if (msg.value > price) {
            uint256 purchaseExcess = SafeMath.sub(msg.value, price);
            msg.sender.transfer(purchaseExcess);          
        }

        if (!isCompositionOnlyWithBaseLayers) { 
            _setCompositionPrice(newTokenIndex, minCompositionFee);
        }
   
        emit CompositionTokenCreated(newTokenIndex, tokenIdToLayers[newTokenIndex], msg.sender);
    }

    /**
    * @dev allows an address to withdraw its balance in the contract
    * @param _tokenId uint256 the token ID
    * @return uint256[] list of layers for a token
    */
    function getTokenLayers(uint256 _tokenId) public view returns(uint256[]) {
        return tokenIdToLayers[_tokenId];
    }

    /**
    * @dev given an array of ids, returns whether or not this composition is valid and unique
    * does not assume the layers array is flattened 
    * @param _tokenIds uint256[] an array of token IDs
    * @return bool whether or not the composition is unique
    */
    function isValidComposition(uint256[] _tokenIds, bytes32 _melodyHash) public view returns (bool) { 
        if (isCompositionOnlyWithBaseLayers) { 
            return _isValidBaseLayersOnly(_tokenIds, _melodyHash);
        } else { 
            return _isValidWithCompositions(_tokenIds, _melodyHash);
        }
    }

    /**
    * @dev returns composition price of a given token ID
    * @param _tokenId uint256 token ID
    * @return uint256 composition price
    */
    function getCompositionPrice(uint256 _tokenId) public view returns(uint256) { 
        return tokenIdToCompositionPrice[_tokenId];
    }

    /**
    * @dev get total price for minting a composition given the array of desired layers
    * @param _tokenIds uint256[] an array of token IDs
    * @return uint256 price for minting a composition with the desired layers
    */
    function getTotalCompositionPrice(uint256[] _tokenIds) public view returns(uint256) {
        uint256 totalCompositionPrice = 0;
        for (uint i = 0; i < _tokenIds.length; i++) {
            require(_tokenLayersExist(_tokenIds[i]));
            totalCompositionPrice = SafeMath.add(totalCompositionPrice, tokenIdToCompositionPrice[_tokenIds[i]]);
        }

        totalCompositionPrice = SafeMath.div(SafeMath.mul(totalCompositionPrice, 105), 100);

        return totalCompositionPrice;
    }

    /**
    * @dev sets the composition price for a token ID. 
    * Cannot be lower than the current composition fee
    * @param _tokenId uint256 the token ID
    * @param _price uint256 the new composition price
    */
    function setCompositionPrice(uint256 _tokenId, uint256 _price) public onlyOwnerOf(_tokenId) {
        _setCompositionPrice(_tokenId, _price);
    }

// ----- PRIVATE FUNCTIONS ------------------------------------------------------------------------

    /**
    * @dev given an array of ids, returns whether or not this composition is valid and unique
    * for when only base layers are allowed
    * does not assume the layers array is flattened 
    * @param _tokenIds uint256[] an array of token IDs
    * @return bool whether or not the composition is unique
    */
    function _isValidBaseLayersOnly(uint256[] _tokenIds, bytes32 _melodyHash) private view returns (bool) { 
        require(_tokenIds.length <= MAX_LAYERS);
        uint256[] memory layers = new uint256[](_tokenIds.length);

        for (uint i = 0; i < _tokenIds.length; i++) { 
            if (!_tokenLayersExist(_tokenIds[i])) {
                return false;
            }

            if (tokenIdToLayers[_tokenIds[i]].length != 1) {
                return false;
            }

            for (uint k = 0; k < layers.length; k++) { 
                if (layers[k] == tokenIdToLayers[_tokenIds[i]][0]) {
                    return false;
                }
                if (layers[k] == 0) { 
                    layers[k] = tokenIdToLayers[_tokenIds[i]][0];
                    break;
                }
            }
        }
    
        return _isUnique(layers, _melodyHash);
    }

    /**
    * @dev given an array of ids, returns whether or not this composition is valid and unique
    * when compositions are allowed
    * does not assume the layers array is flattened 
    * @param _tokenIds uint256[] an array of token IDs
    * @return bool whether or not the composition is unique
    */
    function _isValidWithCompositions(uint256[] _tokenIds, bytes32 _melodyHash) private view returns (bool) { 
        uint256[] memory layers = new uint256[](MAX_LAYERS);
        uint actualSize = 0; 
        if (_tokenIds.length > MAX_LAYERS) { 
            return false;
        }

        for (uint i = 0; i < _tokenIds.length; i++) { 
            uint256 compositionLayerId = _tokenIds[i];
            if (!_tokenLayersExist(compositionLayerId)) { 
                return false;
            }
            uint256[] memory inheritedLayers = tokenIdToLayers[compositionLayerId];
            require(inheritedLayers.length < MAX_LAYERS);
            for (uint j = 0; j < inheritedLayers.length; j++) { 
                require(actualSize < MAX_LAYERS);
                for (uint k = 0; k < layers.length; k++) { 
                    if (layers[k] == inheritedLayers[j]) {
                        return false;
                    }
                    if (layers[k] == 0) { 
                        break;
                    }
                }
                layers[actualSize] = inheritedLayers[j];
                actualSize += 1;
            }
        }
        return _isUnique(_trim(layers, actualSize), _melodyHash);
    }

    /**
    * @dev trims the given array to a given size
    * @param _layers uint256[] the array of layers that will make up the composition
    * @param _size uint the array of layers that will make up the composition
    * @return uint256[] array trimmed to given size
    */
    function _trim(uint256[] _layers, uint _size) private pure returns(uint256[]) { 
        uint256[] memory trimmedLayers = new uint256[](_size);
        for (uint i = 0; i < _size; i++) { 
            trimmedLayers[i] = _layers[i];
        }

        return trimmedLayers;
    }

    /**
    * @dev checks if a token is an existing token by checking if it has non-zero layers
    * @param _tokenId uint256 token ID
    * @return bool whether or not the given tokenId exists according to its layers
    */
    function _tokenLayersExist(uint256 _tokenId) private view returns (bool) { 
        return tokenIdToLayers[_tokenId].length != 0;
    }

    /**
    * @dev set composition price for a token
    * @param _tokenId uint256 token ID
    * @param _price uint256 new composition price
    */
    function _setCompositionPrice(uint256 _tokenId, uint256 _price) private {
        require(_price >= minCompositionFee);
        tokenIdToCompositionPrice[_tokenId] = _price;
        emit CompositionPriceChanged(_tokenId, _price, msg.sender);
    }

    /**
    * @dev calculates the next token ID based on totalSupply
    * @return uint256 for the next token ID
    */
    function _getNextTokenId() internal view returns (uint256) {
        return totalSupply().add(1); 
    }

    /**
    * @dev given an array of ids, returns whether or not this composition is unique
    * assumes the layers are all base layers (flattened)
    * @param _layers uint256[] an array of token IDs
    * @param _melodyHash uint256 image hash for the composition
    * @return bool whether or not the composition is unique
    */
    function _isUnique(uint256[] _layers, bytes32 _melodyHash) private view returns (bool) { 
        return compositions[keccak256(_layers)] == false && melodyHashes[_melodyHash] == false;
    }

    /**
    *@dev given an arrya of ids, returns whether this composition is unique given that the layers are flattened
     */

    function _isUniqueComposition(uint256[] _layers) private view returns (bool) {
        return compositions[keccak256(_layers)] == false;
    }

// ----- ONLY OWNER FUNCTIONS ---------------------------------------------------------------------

    /**
    * @dev payout method for the contract owner to payout contract profits to a given address
    * @param _to address for the payout 
    */
    function payout (address _to) public onlyOwner { 
        totalPayments = 0;
        address(_to).transfer(address(this).balance);
    }

    /**
    * @dev sets global default composition fee for all new tokens
    * @param _price uint256 new default composition price
    */
    function setMinCompositionFee(uint256 _price) public onlyOwner { 
        minCompositionFee = _price;
    }
}
