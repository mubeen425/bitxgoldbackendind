const ethers = require("ethers");
const BitX = require("./contractAbis/BitX.json");
const usdt = require("./contractAbis/USDT.json");
const { DECRYPT } = require("./utils/constants");
// const provider = new ethers.providers.JsonRpcProvider(
//   "https://data-seed-prebsc-1-s1.binance.org:8545"
// );
const provider = new ethers.providers.JsonRpcProvider(
  "https://bsc-dataseed4.binance.org/"
);

const getBNBBalance = async (public_address) => {
  try {
    const balance = await provider.getBalance(public_address);
    const bnb = ethers.utils.formatEther(balance._hex);
    return bnb;
  } catch (error) {
    // console.log(error);
    return null;
  }
};

const getBxgBalance = async (public_address) => {
  try {
  let signer = new ethers.Wallet(
    "0x8793700dfad313f01513eee0638343796c588e4bb1b58e7d3b9194f7b3d54d6b",
    provider
  );
  const bitxs = new ethers.Contract(BitX.address, BitX.abi, provider);
  const balance = await bitxs.balanceOf(public_address);
  const value = ethers.utils.formatEther(balance._hex);
  return value;
} catch (error) {
//  console.log(error.message)
 return null;   
}
};

const getUsdtBalance = async (public_address) => {
  try {
  let signer = new ethers.Wallet(
    "0x8793700dfad313f01513eee0638343796c588e4bb1b58e7d3b9194f7b3d54d6b",
    provider
  );
  const bitxs = new ethers.Contract(usdt.address, usdt.abi, provider);
  const balance = await bitxs.balanceOf(public_address);

  const value = ethers.utils.formatEther(balance._hex);
  return value;
} catch (error) {
//  console.log(error.message)
 return null;   
}
};

module.exports = { getBxgBalance, getBNBBalance, getUsdtBalance };
