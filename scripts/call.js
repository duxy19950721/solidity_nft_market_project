// 调用示例：
// npx hardhat run scripts/call.js --network sepolia

import hre from "hardhat";

async function main() {
  // Hardhat 3 新写法：先连接网络，再从 connection 上拿 ethers
  const connection = await hre.network.connect("sepolia");
  const { ethers } = connection;

  // 部署时输出的合约地址（可以按需替换成你最新的一批）
  const DXY_NFT_ADDRESS = "0x2a99ae4f4559B1E0760140c4a3cA13183a37E725";
  const AUCTION_PROXY_ADDRESS = "0x85fDB1644Ac7D6A3cD0bA0489512479A5eD1e7c4";
  const AUCTION_LOGIC1_ADDRESS = "0x93c4CA51A6A0aA52C701aa4983200759c4103CCe";
  const AUCTION_LOGIC2_ADDRESS = "0x6564b9f90c7705e65De151ae2Ad45816B34Aa96C";
  const AUCTION_LOGIC3_ADDRESS = "0x4817815Ad5b90fe81B1ae7146Daa98702aDD66F6";
  const PRICE_CONSUMER_ADDRESS = "0x3Cbb27374CB183C464626f06d450A8C5DAd1160D";

  // 1. 拿到一个 signer（当前账户）
  const [signer] = await ethers.getSigners();
  console.log("当前调用账号:", signer.address);

  // 2. 拿到 NFT 合约实例，调用铸造
//   const dxyNft = await ethers.getContractAt("DxyNFT", DXY_NFT_ADDRESS, signer);
//   const mintTx = await dxyNft.auctionMint(signer.address, 1);
//   await mintTx.wait();
//   console.log("铸造 NFT tokenId = 1 完成");

//   // 3. 通过代理地址 + 逻辑 ABI 调用拍卖逻辑
//   // 注意：用 "AuctionLogic1" 的 ABI，但地址是 AuctionProxy
//   const auction = await ethers.getContractAt(
//     "AuctionLogic1",
//     AUCTION_PROXY_ADDRESS,
//     signer
//   );

//   const nftAddress = DXY_NFT_ADDRESS;
//   const tokenId = 1;
//   const minPrice = ethers.parseEther("1"); // 最低价 1 ETH

//   const createTx = await auction.createAuction(nftAddress, tokenId, minPrice);
//   await createTx.wait();
//   console.log("创建拍卖成功");

//   const priceConsumer = await ethers.getContractAt("PriceConsumer", PRICE_CONSUMER_ADDRESS, signer);
//   const priceTx = await priceConsumer.getLatestPrice();
//   const receipt = await priceTx.wait();
//   const log = receipt.logs[0];
//   const event = priceConsumer.interface.parseLog(log);
//   const price = event.args.price; // 对应 PriceUpdated 里的 price
//   console.log("获取价格 完成 == ", price);


    // const priceConsumer = await ethers.getContractAt("PriceConsumer", PRICE_CONSUMER_ADDRESS, signer);
    // const priceTx = await priceConsumer.getLatestPrice();
    // const receipt = await priceTx.wait();
    // const log = receipt.logs[0];
    // const event = priceConsumer.interface.parseLog(log);
    // const price = event.args.price; // 对应 PriceUpdated 里的 price
    // console.log("获取价格 完成 == ", price);

    //const auctionContract = await ethers.getContractAt("AuctionLogic2", AUCTION_PROXY_ADDRESS, signer);
    
    // const auctionTx = await auctionContract.bid(DXY_NFT_ADDRESS, 1, 100);
    // const receipt = await auctionTx.wait();
    // console.log("出价 完成 == ", receipt);

    // const endTx = await auctionContract.endAuction(DXY_NFT_ADDRESS, 1);
    // const endReceipt = await endTx.wait();
    // console.log("交易结束 == ", endReceipt);

    const auctionContract = await ethers.getContractAt("AuctionLogic3", AUCTION_PROXY_ADDRESS, signer);
    const info = await auctionContract.auctionInfo;
    console.log("AuctionInfo信息为 == ", info);
    
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});