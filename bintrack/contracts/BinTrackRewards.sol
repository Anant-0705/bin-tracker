// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error URIQueryForNonexistentToken();

contract BinTrackRewards is ERC721URIStorage, Ownable {
    using Strings for uint256;

    // NFT types
    enum NFTType { COUPON, BADGE }
    
    // Counters for NFT IDs
    uint256 private _nextCouponId = 1;
    uint256 private _nextBadgeId = 10001;
    
    // Base URIs for different NFT types
    string private _couponBaseURI;
    string private _badgeBaseURI;
    
    // Mappings
    mapping(uint256 => NFTType) public nftTypes;
    mapping(address => uint256) public userBinCount;

    constructor() ERC721("BinTrackRewards", "BTR") Ownable(msg.sender) {
        _couponBaseURI = "";
        _badgeBaseURI = "";
    }

    function setCouponBaseURI(string memory baseURI) external onlyOwner {
        _couponBaseURI = baseURI;
    }

    function setBadgeBaseURI(string memory baseURI) external onlyOwner {
        _badgeBaseURI = baseURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert URIQueryForNonexistentToken();

        string memory baseURI = nftTypes[tokenId] == NFTType.COUPON ? 
            _couponBaseURI : _badgeBaseURI;

        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    function mintCoupon(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextCouponId++;
        _safeMint(to, tokenId);
        nftTypes[tokenId] = NFTType.COUPON;
        return tokenId;
    }

    function mintBadge(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextBadgeId++;
        _safeMint(to, tokenId);
        nftTypes[tokenId] = NFTType.BADGE;
        return tokenId;
    }

    function updateBinCount(address user, uint256 newBinCount) external onlyOwner {
        uint256 oldBinCount = userBinCount[user];
        userBinCount[user] = newBinCount;

        if (newBinCount > oldBinCount) {
            mintCoupon(user);
        }

        uint256 oldBadgeCount = oldBinCount / 10;
        uint256 newBadgeCount = newBinCount / 10;
        if (newBadgeCount > oldBadgeCount) {
            mintBadge(user);
        }
    }
}