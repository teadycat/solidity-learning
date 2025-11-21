// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract MultiManagedAccess {
    uint public constant MANAGER_NUMBERS = 5;
    uint immutable BACKUP_MANAGER_NUMBERS;

    address public owner;
    address[MANAGER_NUMBERS] public managers;
    bool[MANAGER_NUMBERS] public confirmed;

    constructor(address _owner, address[] memory _managers, uint _manager_numbers) {
        require(_managers.length == _manager_numbers, "Size unmatched");
        owner = _owner;
        BACKUP_MANAGER_NUMBERS = _manager_numbers;
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            managers[i] = _managers[i];
        }
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not authorized");
        _;
    }

    function allConfirmed() internal view returns (bool) {
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            if (!confirmed[i]) {
                return false;
            }
        }
        return true;
    }

    function reset() internal {
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            confirmed[i] = false;
            }
        }

    // 모든 manager가 confirm하지 않은 상황에서는 "Not all confirmed yet" 에러메시지 발생(require 사용)
    modifier onlyAllConfirmed() {
        require(allConfirmed(), "Not all confirmed yet");
        reset();
        _;
    }

    function confirm() external {
        bool found = false;
        for (uint i = 0; i < MANAGER_NUMBERS; i++) {
            if (managers[i] == msg.sender) {
                found = true;
                confirmed[i] = true;
                break;
            }
        }
        // manager가 아닌 주소로부터 발생한 transaction은 "You are not a manager" 에러메시지 발생 (require 사용)
        require(found, "You are not a manager");
    }
}