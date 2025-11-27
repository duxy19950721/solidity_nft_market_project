// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

struct AuctionInfo {
    // tokenId所属owner
    address owner;
    // 最低出价
    uint256 minPrice;
    // 当前出价
    uint256 bidPrice;
    // 出价用户
    address bidUser;
}