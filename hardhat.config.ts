import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-vyper";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  vyper: {
    version: "0.3.10"
  },
  networks: {
    kairos: {
      url: "https://public-en-kairos.node.kaia.io", 
      accounts:["0x3d508deb8bff41c83c00f22bfcad77d5bc73d21bd4d6378e6a509e0ab2780c3f"]
    }
  },
  etherscan: {
      apiKey: {
        kairos: "unnecessary"
      },
      customChains: [
        {
          network: "kairos",
          chainId: 1001,
          urls: {
            apiURL: "https://kairos-api.kaiascan.io/hardhat-verify",
            browserURL: "https://kairos.kaiascan.io",
          }
        }
      ]
    }
};

export default config;