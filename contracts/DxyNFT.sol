// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract DxyNFT is ERC721 {

    constructor() ERC721("DXY_NFT", "DXY_NFT") {}

    // 铸造
    function auctionMint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}