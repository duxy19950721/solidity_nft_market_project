// 我们可以通过 npx hardhat run <script> 来运行想要的脚本
// 部署到本地：npx hardhat run scripts/deploy.js --network hardhatMainnet
// 部署到 sepolia：npx hardhat run scripts/deploy.js --network sepolia

import hre from "hardhat";

async function main() {
  // 通过 Hardhat 3 的 network 接口获取带 ethers 的连接对象
  const connection = await hre.network.connect();
  const { ethers } = connection;
  // // 1. 部署 NFT 合约
  // const DxyNFT = await ethers.getContractFactory("DxyNFT");
  // const dxyNft = await DxyNFT.deploy();
  // await dxyNft.waitForDeployment();
  // console.log("DxyNFT 合约地址:", dxyNft.target);

  // // 2. 部署 Chainlink 价格预言机封装合约 PriceConsumer
  // // 这里的地址是 Sepolia 上 ETH/USD Aggregator 的地址
  // const sepoliaEthUsdAggregator = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  // const PriceConsumer = await ethers.getContractFactory("PriceConsumer");
  // const priceConsumer = await PriceConsumer.deploy(sepoliaEthUsdAggregator);
  // await priceConsumer.waitForDeployment();
  // console.log("PriceConsumer 合约地址:", priceConsumer.target);

  // // 3. 部署逻辑合约（含算价），构造参数是 PriceConsumer 合约地址
  // const AuctionLogic1 = await ethers.getContractFactory("AuctionLogic1");
  // const auctionLogic = await AuctionLogic1.deploy(priceConsumer.target);
  // await auctionLogic.waitForDeployment();
  // console.log("AuctionLogic1 合约地址:", auctionLogic.target);

  // // 4. 部署代理合约，构造参数是逻辑合约地址
  // const AuctionProxy = await ethers.getContractFactory("AuctionProxy");
  // const auctionProxy = await AuctionProxy.deploy(auctionLogic.target);
  // await auctionProxy.waitForDeployment();
  // console.log("AuctionProxy 合约地址:", auctionProxy.target);

  // 5. 部署升级版逻辑合约 AuctionLogic2（构造参数同 AuctionLogic1）
  const AuctionLogic2 = await ethers.getContractFactory("AuctionLogic2");
  const auctionLogic2 = await AuctionLogic2.deploy(priceConsumer.target);
  await auctionLogic2.waitForDeployment();
  console.log("AuctionLogic2 合约地址:", auctionLogic2.target);

  // 6. 通过代理合约调用 upgrade，将实现地址从 AuctionLogic1 升级为 AuctionLogic2
  // 注意：这里使用 AuctionLogic1 的 ABI，地址是代理合约地址，实现 UUPS 升级
  const auctionViaProxy = await ethers.getContractAt(
    "AuctionLogic1",
    "0x85fDB1644Ac7D6A3cD0bA0489512479A5eD1e7c4"
  );
  const upgradeTx = await auctionViaProxy.upgrade(auctionLogic2.target);
  await upgradeTx.wait();
  console.log("已通过代理合约完成升级，当前实现地址应为 AuctionLogic2");
}

// 运行脚本
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


