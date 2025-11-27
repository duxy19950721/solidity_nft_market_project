import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ContractModule", (m) => {
  const priceConsumer = m.contract("PriceConsumer");
  const dxyNFT = m.contract("DxyNFT");
  const auctionProxy = m.contract("AuctionProxy");
  const auctionLogic1 = m.contract("AuctionLogic1");

  // m.call(counter, "incBy", [5n]);

  return { priceConsumer, dxyNFT, auctionProxy, auctionLogic1 };
});
