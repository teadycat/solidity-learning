import hre from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { MyToken, TinyBank } from "../typechain-types";
import M from "minimatch";

describe("TinyBank", () => {
    let signers: HardhatEthersSigner[];
    let myTokenC: MyToken;
    let tinyBankC: TinyBank;
    
    // manager 등록 (조건: 3명 이상 > 5명으로 설정)
    let owner: HardhatEthersSigner;
    let manager1: HardhatEthersSigner;
    let manager2: HardhatEthersSigner;
    let manager3: HardhatEthersSigner;
    let manager4: HardhatEthersSigner;
    let manager5: HardhatEthersSigner;
    let nonManager: HardhatEthersSigner;
    let managerAddresses: string[];
    const MANAGER_NUMBERS = 5;
    
    beforeEach(async () => {
        signers = await hre.ethers.getSigners();
        
        // manager 역할 할당
        owner = signers[0];
        manager1 = signers[1];
        manager2 = signers[2];
        manager3 = signers[3];
        manager4 = signers[4];
        manager5 = signers[5];
        nonManager = signers[9];
        managerAddresses = [manager1.address, manager2.address, 
            manager3.address, manager4.address, manager5.address];   

        myTokenC = await hre.ethers.deployContract("MyToken", 
            ["MyToken", "MT", DECIMALS, MINTING_AMOUNT], owner); 
        tinyBankC = await hre.ethers.deployContract("TinyBank",
            [await myTokenC.getAddress(), owner.address, managerAddresses, MANAGER_NUMBERS]);
        await myTokenC.setManager(tinyBankC.getAddress());
    });
    
    describe("Initialized state check", async () => {
        it("should return totalStaked 0", async () => {
            expect(await tinyBankC.totalStaked()).equal(0);
        });

        it("should return staked 0 amount of signer0", async () => {
            const signer0 = signers[0];
            expect(await tinyBankC.staked(signer0.address)).equal(0);
        });

    });

    describe("Staking", () => {
        it("should return staked amount", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);
            expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
            expect(await tinyBankC.totalStaked()).equal(stakingAmount);
            expect(await myTokenC.balanceOf(tinyBankC)).equal(await tinyBankC.totalStaked());
        });
    });

    describe("Withdraw", () => {
        it("should return 0 staked after withdrawing total token", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);
            await tinyBankC.withdraw(stakingAmount);
            expect(await tinyBankC.staked(signer0.address)).equal(0);
        });
    });

    describe("Reward", () => {
        it("should reward 1MT every blocks", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);

            const BLOCKS = 5n;
            const transforAmount = hre.ethers.parseUnits("1", DECIMALS);
            for (var i = 0; i < BLOCKS; i++) {
                await myTokenC.transfer(transforAmount, signer0.address);
            }
            await tinyBankC.withdraw(stakingAmount);
            expect(await myTokenC.balanceOf(signer0.address)).equal(
                hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString()));
        });

        // manager가 아닌 주소로부터 발생한 transaction은 "You are not a manager" 에러메시지 발생
        it("should revert if sender is not a manager", async () => {
            await expect(tinyBankC.connect(nonManager).confirm())
                .to.be.revertedWith("You are not a manager");
        });
        
        // 모든 manager가 confirm하지 않은 상황에서는 "Not all confirmed yet" 에러메시지 발생생
        it("should revert when not confirmed by all managers", async () => {
            const rewardToChange = hre.ethers.parseUnits("50", DECIMALS);
            
            // 가정: 5명의 manager 중 2명만 confirm
            await tinyBankC.connect(manager1).confirm();
            await tinyBankC.connect(manager2).confirm();
            await expect(tinyBankC.connect(manager1).setRewardPerBlock(rewardToChange))
                .to.be.revertedWith("Not all confirmed yet"); 
        });
    });
});