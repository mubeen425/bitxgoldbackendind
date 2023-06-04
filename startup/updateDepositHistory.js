const { ethers } = require("ethers");
const { User } = require("../models/user");
const { DepositCrypto } = require("../models/deposit_crypto");

module.exports=async function getDepositHistory() {
  let tokenContractAddressBxg = "0x4BBDE1FD97121B68c882fbAfA1C6ee0099c2Eb8b";
  let tokenContractAddressUsdt = "0x55d398326f99059fF775485246999027B3197955";
  const provider = new ethers.providers.WebSocketProvider(
    "wss://bsc.getblock.io/8bf8c02a-6a27-46a1-8705-50d229768b7d/mainnet/"
    );
    // "wss://bsc.getblock.io/8bf8c02a-6a27-46a1-8705-50d229768b7d/testnet/"
  //ws-node.nariox.org:443
  const tokenAbi = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function balanceOf(address account) external view returns (uint256)",
  ];
  const contractBxg = new ethers.Contract(
    tokenContractAddressBxg,
    tokenAbi,
    provider
  );
  const contractUsdt = new ethers.Contract(
    tokenContractAddressUsdt,
    tokenAbi,
    provider
  );
  contractBxg.on("Transfer", async (from, to, value, event) => {
    console.log("bxg",from,to,value,)
    const users=await User.findAll();
    for (const usr of users) {
      if (to === usr.wallet_public_key) {
        await DepositCrypto.create({
          wallet_address:from,
          token_name:"BXG",
          amount:ethers.utils.formatUnits(value.toString()),
          blockHash:event.blockHash,
          user_id:usr.id
        })
      }
    }
})

contractUsdt.on("Transfer", async (from, to, value, event) => {
  console.log("usdt",from,to,value,)

 const users=await User.findAll();
 for (const usr of users) {
   if (to === usr.wallet_public_key) {
     await DepositCrypto.create({
       wallet_address:from,
       token_name:"USDT",
       amount:ethers.utils.formatUnits(value.toString()),
       blockHash:event.blockHash,
       user_id:usr.id
     })
   }
 }
})


provider.on('block', async (blockNumber) => {
  const block = await provider.getBlock(blockNumber);
  if (block.transactions.length > 0) {
    for (let i = 0; i < block.transactions.length; i++) {
      const tx = block.transactions[i];
      const receipt = await provider.getTransaction(tx);
      const users=await User.findAll();
      for (const usr of users) {
        if (receipt.to === usr.wallet_public_key) {
          await DepositCrypto.create({
            wallet_address:receipt.from,
            token_name:"BNB",
            amount:ethers.utils.formatUnits(receipt.value.toString()),
            blockHash:receipt.blockHash,
            user_id:usr.id
          })
        }
      }
    }
  }
});
}

