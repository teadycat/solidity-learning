// staking > 암호화폐를 블록체인 네트워크에 맡기고 그 대가로 보상 받음
// deposit(MyToken) 예금 / withdraw(MyToken) 출금

// MyToken: token balance management
// - the balance of TinyBank address

// TinyBank: deposit / withdraw vault(금고)
// - users token management
// - user > deposit > TinyBank > transfer(user > TinyBank)

// Reward(보상)
// - reward token: MyToken
// - reward resources: 1MT/block minting > 블록 하나당 1MT
// - reward strategy: staked[user]/totalStaked distribution > 각 블록마다 전체 스테이킹 금액 대비 자신의 비율만큼 보상

// - signer0 block 0 staking > signer0이 0~4번 블록에서 쌓인 보상 얻음
// - signer1 block 5 staking > signer1이 5번 블록 이후 쌓인 보상 얻음
// - 0-- 1-- 2-- 3-- 4-- 5--
// - |                   |
// - signer0 10MT        signer1 10MT

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ManagedAccess.sol";

interface IMyToken {
    function transfer (uint256 amount, address to) external;
    function transferFrom(address from, address to, uint256 amount) external;
    function mint(uint256 amount, address owner) external;
}

contract TinyBank is ManagedAccess {
    event Staked(address from, uint256 amount);
    event Withdraw(uint256 amount, address to);

    IMyToken public stakingToken;

    mapping(address => uint256) public lastClaimedBlock;

    uint256 defaultRewardPerBlock = 1*10**18;
    uint256 rewardPerBlock; 

    mapping(address => uint256) public staked;
    uint256 public totalStaked;

    constructor(IMyToken _stakingToken) ManagedAccess(msg.sender, msg.sender) {
        stakingToken = _stakingToken;
        rewardPerBlock = defaultRewardPerBlock;
    }

    // who, when?
    modifier updateReward(address to) {
        if (staked[to] > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = (blocks*rewardPerBlock*staked[to]) / totalStaked;
            stakingToken.mint(reward, to);
        }
        lastClaimedBlock[to] = block.number;
        _; // caller's code
    }

    function setRewardPerBlock(uint256 _amount) external onlyManager {
        rewardPerBlock = _amount;
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount >= 0, "cannot stake 0 amount");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(staked[msg.sender] >= _amount, "insufficient staked token");
        stakingToken.transfer(_amount, msg.sender);
        staked[msg.sender] -= _amount;
        totalStaked -= _amount;
        emit Withdraw(_amount, msg.sender);
    }
}