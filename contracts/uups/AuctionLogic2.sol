// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "../struct/AuctionInfo.sol";
import "../chainlink/PriceConsumer.sol";

/**
 * 升级版拍卖逻辑合约（仅升级 endAuction 逻辑，其它方法尽量保持与 AuctionLogic1 一致）：
 * - 沿用与 AuctionProxy 相同的存储布局（implementation / admin / auctionInfo）
 * - endAuction 新增：NFT 所有权转给最高出价者，并将价格转给卖家
 */
contract AuctionLogic2 {
    // 状态变量和 proxy 合约一致，防止插槽冲突
    address public implementation;
    address public admin;
    mapping(address => mapping(uint256 => AuctionInfo)) auctionInfo;

    PriceConsumer public priceConsumer;

    error TokenNotOwner(uint256 tokenId);
    error InvalidMinPrice(uint256 minPrice);
    error InvalidAuctionStatus(uint256 tokenId);

    function upgrade(address newImplementation) external {
        require(msg.sender == admin, "Only admin");
        implementation = newImplementation;
    }

    constructor(address _priceConsumer) {
        // 初始化预言机地址
        priceConsumer = PriceConsumer(_priceConsumer);
    }

    /**
     * 创建拍卖（卖家发起，不收钱，只记录信息）
     */
    function createAuction(
        address nftAddress,
        uint256 tokenId,
        uint256 minPrice
    )
        external
        checkTokenOnlyOwner(nftAddress, tokenId)
        checkInvalidPrice(minPrice)
        checkTokenIsAuction(nftAddress, tokenId)
        returns (bool)
    {
        AuctionInfo storage auction = auctionInfo[nftAddress][tokenId];
        auction.owner = msg.sender;
        auction.minPrice = minPrice;
        auction.bidPrice = minPrice;
        auction.bidUser = msg.sender;

        return true;
    }

    function bid(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        checkInvalidPrice(price)
        checkTokenIsAuction(nftAddress, tokenId)
        returns (bool)
    {
        AuctionInfo storage auction = auctionInfo[nftAddress][tokenId];

        // 校验出价是否大于当前出价
        require(price > auction.bidPrice, "Price is not higher than current bid");

        // 记录当前出价
        auction.bidPrice = price;
        // 记录当前出价用户
        auction.bidUser = msg.sender;

        return true;
    }

    /**
     * 结束交易（卖家调用，完成 NFT 转移 + 结算）
     * 相比 AuctionLogic1：
     * - 新增：NFT 从 auction.owner 转给 bidUser
     * - 修正：将 price 转给卖家（owner），而不是出价人
     */
    function endAuction(
        address nftAddress,
        uint256 tokenId
    )
        external
        checkTokenOnlyOwner(nftAddress, tokenId)
        checkTokenIsAuction(nftAddress, tokenId)
    {
        AuctionInfo storage auction = auctionInfo[nftAddress][tokenId];

        uint256 price = auction.bidPrice;
        address bidUser = auction.bidUser;
        address owner_ = auction.owner;

        // 如果有真实买家（最高出价人不是 owner 自己），则完成 NFT 转移和资金结算
        if (bidUser != address(0) && bidUser != owner_) {
            // 将 NFT 从卖家转给买家（需要卖家预先授权给代理合约）
            IERC721(nftAddress).transferFrom(owner_, bidUser, tokenId);

            // 将价格转给卖家（这里沿用原价格字段，不改其它逻辑）
            payable(owner_).transfer(price);
        }

        // 清空拍卖信息
        delete auctionInfo[nftAddress][tokenId];
    }

    /**
     * 计算价格，将以太坊的价格转换为美元
     * 这里沿用原有逻辑，不修改语义
     */
    function calculatePrice(uint256 price) public returns (int256) {
        uint256 eth = price / 1e18;
        return int256(eth) * priceConsumer.getLatestPrice();
    }

    // 检查tokenId是否正在拍卖中
    modifier checkTokenIsAuction(address nftAddress, uint256 tokenId) {
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


