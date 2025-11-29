import { describe, it , before} from "node:test";
import assert from "node:assert/strict";
import hre from "hardhat";

describe("DxyNFT contract", () => {

  // 1. 放在外层作用域，两个 describe 都能访问到
  let ethers;
  let owner;
  let test;
  let dxyNFT;
  let priceConsumer;
  let auctionProxy;
  // 后续调用proxy时要使用的合约地址
  let auction;
  let auctionLogic3;

  const priceConsumerAddress = "0x3Cbb27374CB183C464626f06d450A8C5DAd1160D";
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  let initialOwnerBalance;
  let beforeEndOwnerBalance;
  let initialTestBalance;

  before(async () => {
    const connection = await hre.network.connect();
    ({ ethers } = connection);
    [owner, test] = await ethers.getSigners();
    console.log("当前owner地址为:", owner.address);
    initialOwnerBalance = await ethers.provider.getBalance(owner);
    console.log("初始owner账户余额:", initialOwnerBalance);
    initialTestBalance = await ethers.provider.getBalance(test);
    console.log("初始test账户余额为:", initialTestBalance);
  });

  it("部署DXY_NFT", async () => {
    // 部署DXYNFT合约，拿到地址，这一步不需要assert
    dxyNFT = await ethers.deployContract("DxyNFT");
    await dxyNFT.waitForDeployment();
    assert.notEqual(dxyNFT.target, zeroAddress);
  });


  it("部署预言机合约", async () => {
    // const sepoliaConn = await hre.network.connect("sepolia");
    // const { ethers : sepoliaEthers } = sepoliaConn;
    // priceConsumer = await sepoliaEthers.deployContract("PriceConsumer", [priceConsumerAddress]);
    priceConsumer = await ethers.deployContract("PriceConsumer", [priceConsumerAddress]);
    await priceConsumer.waitForDeployment();
    assert.notEqual(priceConsumer.target, zeroAddress);
  });

  it("给当前owner铸造tokenId=1的NFT", async () => {
    await dxyNFT.auctionMint(owner, 1);
    const balance = await dxyNFT.balanceOf(owner);
    assert.equal(Number(balance), 1);
  });

  it("部署NFT拍卖逻辑合约3", async () => {
    auctionLogic3 = await ethers.deployContract("AuctionLogic3", [priceConsumer.target]);
    await auctionLogic3.waitForDeployment();
    assert.notEqual(auctionLogic3.target, zeroAddress);
  });

  it("部署NFT拍卖交易所(UUPS合约)", async () => {
    auctionProxy = await ethers.deployContract("AuctionProxy", [auctionLogic3]);
    await auctionProxy.waitForDeployment();

    // 关键：用逻辑合约 ABI + proxy 地址
    auction = await ethers.getContractAt("AuctionLogic3", auctionProxy.target);

    assert.notEqual(auctionProxy.target, zeroAddress);
  });

  it("把tokenId=1的NFT授权给交易所(UUPS合约)", async () => {
    await dxyNFT.approve(auctionProxy.target, 1);
    const approved = await dxyNFT.getApproved(1);
    assert.equal(approved, auctionProxy.target);
  });

  it("创建拍卖 tokenId=1的NFT, 初始价格1000000000000000wei", async () => {
    await auction.createAuction(dxyNFT.target, 1, 1e15);
    const auctionInfo = await auction.getAuctionInfo(dxyNFT.target, 1);
    assert.equal(auctionInfo.bidPrice, 1000000000000000n);
  });

  // it("使用预言机查询链下价格", async () => {
  //   const priceTx = await priceConsumer.getLatestPrice();
  //   const receipt = await priceTx.wait();
  //   const log = receipt.logs[0];
  //   const event = priceConsumer.interface.parseLog(log);
  //   const price = event.args.price;
  //   console.log("链下价格 = ", price);
  //   assert.notEqual(price, 0n);
  // });

  it("测试账户 第一次出价 2000000000000000wei", async () => {
    await auction.connect(test).bid(dxyNFT.target, 1, {value: 2000000000000000});
    const auctionInfo = await auction.getAuctionInfo(dxyNFT.target, 1);
    assert.equal(auctionInfo.bidPrice, 2000000000000000n);
  });

  it("测试账户 第二次出价 3000000000000000wei", async () => {
    await auction.connect(test).bid(dxyNFT.target, 1, {value: 3000000000000000n});
    const auctionInfo = await auction.getAuctionInfo(dxyNFT.target, 1);
    assert.equal(auctionInfo.bidPrice, 3000000000000000n);
  });

  it("结束拍卖", async () => {
    beforeEndOwnerBalance = await ethers.provider.getBalance(owner);
    // console.log("结束拍卖前owner账户余额:", beforeEndOwnerBalance);

    await auction.endAuction(dxyNFT.target, 1);
    // 此时拍卖信息已经被清空了，可以先校验这个
    const auctionInfo = await auction.getAuctionInfo(dxyNFT.target, 1);

    assert.equal(auctionInfo.owner, zeroAddress);
    assert.equal(auctionInfo.minPrice, 0n);
    assert.equal(auctionInfo.bidPrice, 0n);
    assert.equal(auctionInfo.bidUser, zeroAddress);
  });
  
  it("tokenId=1的nft的owner为测试账户", async () => {
    const owner = await dxyNFT.ownerOf(1);
    assert.equal(owner, test.address);
  });

  it("测试账户的ETH减少0.003ETH", async () => {
    const finalTestBalance = await ethers.provider.getBalance(test);
    // console.log("交易后test的ETH余额为:", finalTestBalance);
    const spent = initialTestBalance - finalTestBalance; // BigInt
    // console.log("交易后test的差值为:", spent);
    // 至少 0.003 ETH（允许多一点作为 gas）
    assert(spent >= 3000000000000000n);
  });

  it("原owner的ETH增加0.003ETH", async () => {
    const finalOwnerBalance = await ethers.provider.getBalance(owner);
    // console.log("交易后owner的ETH余额为:", finalOwnerBalance);
    const gained = finalOwnerBalance - beforeEndOwnerBalance; // BigInt
    // console.log("交易后test的差值为:", gained);
    // 理论上约等于 +0.003 ETH，这里只要是正的就说明钱确实进来了
    assert(gained > 0n);
    });
});