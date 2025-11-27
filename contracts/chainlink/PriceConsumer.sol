// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumer {
    AggregatorV3Interface internal priceFeed;
    event PriceUpdated(uint80 roundID,int256 price,uint startedAt,uint timeStamp,uint80 answeredInRound);

    constructor(address _aggregator) {
        priceFeed = AggregatorV3Interface(_aggregator);
    }

    function getLatestPrice() public returns (int256) {
        (
            uint80 roundID,
            int256 price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        emit PriceUpdated(roundID,price,startedAt,timeStamp,answeredInRound);
        return price;
    }
}