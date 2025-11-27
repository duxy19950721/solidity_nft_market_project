// 升级脚本：只负责部署 AuctionLogic2，并通过 AuctionProxy 调用 upgrade 完成升级
// 运行命令（Sepolia）：npx hardhat run scripts/deploy2.js --network sepolia

import hre from "hardhat";

async function main() {
  // 通过 Hardhat 3 的 network 接口获取带 ethers 的连接对象
  const connection = await hre.network.connect();
  const { ethers } = connection;

  // 已经在链上存在的合约地址（你之前部署那一批）
  const PRICE_CONSUMER_ADDRESS = "0x3Cbb27374CB183C464626f06d450A8C5DAd1160D";
  const AUCTION_PROXY_ADDRESS = "0x85fDB1644Ac7D6A3cD0bA0489512479A5eD1e7c4";

  // 1. 部署升级版逻辑合约 AuctionLogic2（构造参数同 AuctionLogic1，用 PriceConsumer 地址）
  const AuctionLogic3 = await ethers.getContractFactory("AuctionLogic3");
  const auctionLogic3 = await AuctionLogic3.deploy(PRICE_CONSUMER_ADDRESS);
  await auctionLogic3.waitForDeployment();
  console.log("AuctionLogic3 合约地址:", auctionLogic3.target);

  // 2. 通过代理合约调用 upgrade，将实现地址从 AuctionLogic1 升级为 AuctionLogic2
  // 注意：这里使用 AuctionLogic2 的 ABI，地址是代理合约地址（UUPS 升级只能通过 proxy 改 storage）
  const auctionViaProxy = await ethers.getContractAt(
    "AuctionLogic2",
    AUCTION_PROXY_ADDRESS
  );
  const upgradeTx = await auctionViaProxy.upgrade(auctionLogic3.target);
  await upgradeTx.wait();
  console.log("已通过代理合约完成升级，当前实现地址应为 AuctionLogic3");
}

// 运行脚本
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


