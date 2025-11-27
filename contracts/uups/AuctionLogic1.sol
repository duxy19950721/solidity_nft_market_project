// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "../struct/AuctionInfo.sol";
import "../chainlink/PriceConsumer.sol";

contract AuctionLogic1 {
    // 状态变量和proxy合约一致，防止插槽冲突
    address public implementation; 
    address public admin;
    mapping(address => mapping(uint256 => AuctionInfo)) auctionInfo;

    PriceConsumer public priceConsumer;

    error TokenNotOwner(uint256 tokenId);
    error InvalidMinPrice(uint256 minPrice);
    error InvalidAuctionStatus(uint256 tokenId);

    function upgrade(address newImplementation) external {
        require(msg.sender == admin);
        implementation = newImplementation;
    }

    constructor(address _priceConsumer) {
        // 初始化预言机地址
        priceConsumer = PriceConsumer(_priceConsumer);
    }

    // 创建拍卖
    function createAuction(address nftAddress, uint256 tokenId, uint256 minPrice) external checkTokenOnlyOwner(nftAddress, tokenId) checkInvalidPrice(minPrice) checkTokenIsAuction(nftAddress, tokenId) returns(bool) {
        // 记录tokenId的拍卖信息
        AuctionInfo storage auction = auctionInfo[nftAddress][tokenId];
        auction.owner = msg.sender;
        auction.minPrice = minPrice;
        auction.bidPrice = minPrice;
        auction.bidUser = msg.sender;

        return true;
    }

    // 出价
    function bid(address nftAddress, uint256 tokenId, uint256 price) external checkInvalidPrice(price) checkTokenIsAuction(nftAddress, tokenId) returns(bool) {
        AuctionInfo storage auction = auctionInfo[nftAddress][tokenId];
        // 校验出价是否大于当前出价
        require(price > auction.bidPrice, "Price is not higher than the current bid");
        // 记录当前出价
        auction.bidPrice = price;
        // 记录当前出价用户
        auction.bidUser = msg.sender;

        return true;
    }
    
    // 结束交易
    function endAuction(address nftAddress, uint256 tokenId) external checkTokenOnlyOwner(nftAddress, tokenId) checkTokenIsAuction(nftAddress, tokenId) {
        AuctionInfo storage auction = auctionInfo[nftAddress][tokenId];
        // 获取当前tokenId的最高价
        uint256 price = auction.bidPrice;
        // 获取出价用户
        address bidUser = auction.bidUser;

        // todo 转账
        payable(bidUser).transfer(price);

        // 清空拍卖信息
        delete auctionInfo[nftAddress][tokenId];
    }

    // 计算价格，将以太坊的价格转换为美元
    function calculatePrice(uint256 price) public returns(int256) {
        uint256 eth = price / 1000000000000000000;
        return int256(eth) * priceConsumer.getLatestPrice();
    }

    // 检查tokenId是否正在拍卖中
    modifier checkTokenIsAuction(address nftAddress, uint256 tokenId) {
        // 这里的校验暂时用owner做比较，不知道如何判断空
        if (auctionInfo[nftAddress][tokenId].owner == address(0)) {
            revert InvalidAuctionStatus(tokenId);
        }
        _;
    }

    // 检查当前操作tokenId的是否是tokenId所属owner
    modifier checkTokenOnlyOwner(address nftAddress, uint256 tokenId) {
        if (IERC721(nftAddress).ownerOf(tokenId) != msg.sender) {
            revert TokenNotOwner(tokenId);
        }
        _;
    }

    // 校验价格是否是正常大于0的
    modifier checkInvalidPrice(uint256 price) {
        if (price <= 0) {
            revert InvalidMinPrice(price);
        }
        _;
    }
}