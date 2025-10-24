"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modules_1 = require("@nomicfoundation/hardhat-ignition/modules");
exports.default = (0, modules_1.buildModule)("MyTokenDeploy", (m) => {
    const MyTokenC = m.contract("MyToken", ["MyToken", "MT", 18]);
    return { MyTokenC };
});
