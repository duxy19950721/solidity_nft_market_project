// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../struct/AuctionInfo.sol";

contract AuctionProxy {
    // 状态变量和proxy合约一致，防止插槽冲突
    address public implementation; 
    address public admin;
    mapping(address => mapping(uint256 => AuctionInfo)) auctionInfo;
    event delegatecall(bool success, bytes data);
    // 构造函数，初始化admin和逻辑合约地址
    constructor(address _implementation){
        admin = msg.sender;
        implementation = _implementation;
    }
    
    receive() external payable {

    }

    fallback() external payable {
        (bool success, bytes memory data) = implementation.delegatecall(msg.data);
        emit delegatecall(success, data);
        if (!success) {
            assembly {
                revert(add(data, 0x20), mload(data))
            }
        }
        assembly {
            return(add(data, 0x20), mload(data))
        }
    }
}