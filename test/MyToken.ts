import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./constant";

describe("My Token", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];

  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", 
      ["MyToken", "MT", DECIMALS, MINTING_AMOUNT]);
  });

  describe("Basic state value check", () => {
    it("should return name", async () => {
      expect(await myTokenC.name()).equal("MyToken");
    });

    it("should return symbol", async () => {
      expect(await myTokenC.symbol()).equal("MT");
    });

    it("should return decimals", async () => {
      expect(await myTokenC.decimals()).equal(DECIMALS);
    });

    it("should return 100 totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(MINTING_AMOUNT*10n**DECIMALS);
    });
  });

  // 1MT = 1*10^18
  describe("Mint", () => {
    it("should return initial supply + 1MT balance for signer 0", async () => {
      const signer0 = signers[0];
      const oneMt = hre.ethers.parseUnits("1", DECIMALS);
      await myTokenC.mint(oneMt, signer0.address) 
      expect(await myTokenC.balanceOf(signer0.address))
      .equal(MINTING_AMOUNT*10n**DECIMALS + oneMt); // BigInt(1)=1n
    });

    // TDD: Test Driven Development
    it("should return or revert when minting infinitly", async () => {
      const hacker = signers[2];
      const mintingAgainAmount = hre.ethers.parseUnits("100", DECIMALS);
      await expect(myTokenC.connect(hacker).mint(mintingAgainAmount, hacker.address))
      .to.be.revertedWith("You are not authorized to manage this contract");
    });
    // owner가 singer0이 minting하는 test 만들어보기,,
  });

  describe("Transfer", () => {
    it("should have 0.5MT", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(await myTokenC.transfer(
        hre.ethers.parseUnits("0.5", DECIMALS), signer1.address)).to.emit(myTokenC, "Transfer")
        .withArgs(signer0.address, signer1.address, hre.ethers.parseUnits("0.5", DECIMALS));

        expect(await myTokenC.balanceOf(signer1.address))
      .equal(hre.ethers.parseUnits("0.5", DECIMALS));   
    });

    it("should be reverted with insufficient balance error", async () => {
      const signer1 = signers[1];
      await expect(myTokenC.transfer(
        hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS), 
        signer1.address)).to.be.revertedWith("insufficient balance");
    });
  });

  describe("TrasferFrom", () => {
    it("should emit Approval event", async () => {
      const signer1 = signers[1];
      await expect(myTokenC.approve(signer1.address, hre.ethers.parseUnits("10", DECIMALS)))
      .to.emit(myTokenC, "Approval").withArgs(signer1.address, hre.ethers.parseUnits("10", DECIMALS));
    });

    it("should be reverted with insufficient allowance error", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(myTokenC.connect(signer1)
      .transferFrom(signer0.address, signer1.address, hre.ethers.parseUnits("1", DECIMALS)))
      .to.be.revertedWith("insufficient allowance");
    });

    // // 1. approve: signer1에게 signer0의 자산 이동 권한 부여
    // it("approve signer1 to transfer signer0's tokens", async () => {
    //     const signer0 = signers[0];
    //     const signer1 = signers[1];
    //     const amount1 = hre.ethers.parseUnits("28", DECIMALS); // 28MT
        
    //     // signer0이 signer1에게 28MT 만큼의 자산 이동 권한 부여
    //     await expect(myTokenC.approve(signer1.address, amount1))
    //         .to.emit(myTokenC, "Approval")
    //         .withArgs(signer1.address, amount1); 
        
    //     // allowance 확인
    //     expect(await myTokenC.allowance(signer0.address, signer1.address)).equal(amount1);
    // });

    // // 2. transferFrom: signer1이 signer0의 MT토큰을 자신의 주소(signer1)에게 전송
    // it("signer1 transfers MT tokens from signer0 to signer1", async () => {
    //     const signer0 = signers[0];
    //     const signer1 = signers[1];
    //     const amount1 = hre.ethers.parseUnits("28", DECIMALS); // 28MT
    //     await myTokenC.approve(signer1.address, amount1); // 다시 approve
        
    //     // signer1이 transferFrom 호출 (28MT 전송)
    //     await expect(myTokenC.connect(signer1) 
    //         .transferFrom(signer0.address, signer1.address, amount1))
    //         .to.emit(myTokenC, "Transfer")
    //         .withArgs(signer0.address, signer1.address, amount1);
        
    //     // allowance가 사용된 만큼 감소했는지 확인
    //     expect(await myTokenC.allowance(signer0.address, signer1.address)).equal(0n);
    // });

    // // 3. balance 확인
    // it("check balances after transferFrom", async () => {
    //     const initialTotalSupply = MINTING_AMOUNT * 10n**DECIMALS;
    //     const signer0 = signers[0];
    //     const signer1 = signers[1];
    //     const amount1 = hre.ethers.parseUnits("28", DECIMALS); // 28MT

    //     // 다시 approve 및 transferFrom
    //     await myTokenC.approve(signer1.address, amount1);
    //     await myTokenC.connect(signer1).transferFrom(signer0.address, signer1.address, amount1);

    //     // 초기 잔액 (signer0에게 100MT, signer1에게 0MT)
    //     const signer1InitialBalance = 0n; 
        
    //     // signer0의 잔액은 감소 (100MT - 28MT = 72MT)
    //     expect(await myTokenC.balanceOf(signer0.address))
    //         .equal(initialTotalSupply - amount1);
        
    //     // signer1의 잔액은 증가 (0MT + 28MT = 28MT)
    //     expect(await myTokenC.balanceOf(signer1.address))
    //         .equal(signer1InitialBalance + amount1);
    // });
  });
});