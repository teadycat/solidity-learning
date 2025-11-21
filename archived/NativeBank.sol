// user가 nativeToken을 staking, staking한 양만큼 balance 관리
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NativeBank {
    mapping (address => uint256) public balanceOf;
    bool lock;

        modifier noreentrancy {
            require(!lock, "is now wroking on");
            lock = true;
            _;
            lock = false;  
        }

        function withdraw() external noreentrancy{
            uint256 balance = balanceOf[msg.sender];
            require(balance > 0, "insufficient balance");

            (bool success, ) = msg.sender.call{value: balance}("");
            require(success, "failed to send native token");

            balanceOf[msg.sender] = 0;
        }

        receive() external payable { // 예약 함수
            balanceOf[msg.sender] += msg.value; 
        }
}