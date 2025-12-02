import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MyTokenDeploy", (m) => {
    const MyTokenC = m.contract("MyToken", ["MyToken", "MT", 18, 100]);
    const tinyBankC = m.contract("TinyBank", [MyTokenC]);
    m.call(MyTokenC, "setManager", [tinyBankC]);
    return { MyTokenC, tinyBankC };
});