import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import { configVariable, defineConfig } from "hardhat/config";

const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/PA1Cb01t-LWAA1GUMtMVP";
const SEPOLIA_PRIVATE_KEY = "0x25eb9a26852d7ac2f0c111f99d666013df3ad6cbaf4026328f798f9b8c07d98f";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin, hardhatEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: SEPOLIA_RPC_URL,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
});
