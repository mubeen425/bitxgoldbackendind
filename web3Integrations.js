const bitXStake = require("./contractAbis/BitXStaking.json");
const usdt = require("./contractAbis/USDT.json");
const bitXSwap = require("./contractAbis/BitXGoldSwap.json");
const bitX = require("./contractAbis/BitX.json");
const config = require("config");
const ethers = require("ethers");

// const provider = new ethers.getDefaultProvider("https://data-seed-prebsc-1-s1.binance.org:8545/")
const provider = new ethers.getDefaultProvider(
  "https://bsc-dataseed4.binance.org/"
);

const handlerefer = async (
  stakeReferals,
  bonusReferal,
  public_key,
  private_key
) => {
  let err = null;
  let signer = new ethers.Wallet(private_key, provider);
  try {
    const swap = new ethers.Contract(bitXSwap.address, bitXSwap.abi, signer);

    const value = await swap.Referral(public_key);
    if (value === "0x0000000000000000000000000000000000000000") {
      const tx = await (
        await swap.addReferral(stakeReferals, bonusReferal)
      ).wait();
      if (!tx.events) {
        err = "Refer Failed";
      }
    }
  } catch (error) {
    err = error;
  }
  return err;
};

const handleBuy = async (bxgvalue, public_key, private_key) => {
  let err = null;
  let blockHash = null;
  try {
    let signer = new ethers.Wallet(private_key, provider);
    const swap = new ethers.Contract(bitXSwap.address, bitXSwap.abi, signer);
    const usdtToken = new ethers.Contract(usdt.address, usdt.abi, signer);

    const amount = ethers.utils.parseEther(bxgvalue);
    // const value = await usdtToken.allowance(
    //   public_key,
    //   bitXSwap.address
    // );
    if (true) {
      const amountApprove = ethers.utils.parseEther(
        "100000000000000000000000000000000000000000"
      );
      const v = await (
        await usdtToken.approve(bitXSwap.address, amountApprove)
      ).wait();
    }
    const tx = await (await swap.swapBuy(amount)).wait();
    if (!tx.events) {
      err = "Transaction Failed";
      console.log("tx", err);
    }
    blockHash = tx.blockHash;
  } catch (error) {
    err = error.message;
    console.log(err);
  }
  return { err, blockHash };
};

const handleSell = async (bxgvalue, public_key, private_key) => {
  let err = null;
  let blockHash = null;
  try {
    let signer = new ethers.Wallet(private_key, provider);
    const bitXGold = new ethers.Contract(bitX.address, bitX.abi, signer);
    const amount = await ethers.utils.parseEther(bxgvalue.toString()); // paste amount heres
    const tx = await (
      await bitXGold.transfer(
        config.get("adminPublicAdd"), //admin address
        amount,
        { gasLimit: 300000 }
      )
    ).wait(); // replace address with admin wallet address
    if (!tx.events) {
      err = "Transaction Failed";
    }
    blockHash = tx.blockHash;
  } catch (error) {
    err = error.message;
  }
  return { err, blockHash };
};

const transferUsdt = async (usdtvalue, public_key, private_key) => {
  let err = null;
  let blockHash = null;
  try {
    let signer = new ethers.Wallet(private_key, provider);
    const usdttoken = new ethers.Contract(usdt.address, usdt.abi, signer);
    const amount = await ethers.utils.parseEther(usdtvalue.toString());
    const tx = await (
      await usdttoken.transfer(public_key, amount, { gasLimit: 300000 })
    ).wait();
    if (!tx.events) {
      err = "Transaction Failed";
    }
    blockHash = tx.blockHash;
  } catch (error) {
    err = error.message;
  }
  return { err, blockHash };
};

const transferBxg = async (bxgvalue, public_key, private_key) => {
  let err = null;
  let blockHash = null;
  try {
    let signer = new ethers.Wallet(private_key, provider);
    const bitXGold = new ethers.Contract(bitX.address, bitX.abi, signer);
    const amount = await ethers.utils.parseEther(bxgvalue.toString()); // paste amount heres
    const tx = await (
      await bitXGold.transfer(public_key, amount, { gasLimit: 300000 })
    ).wait(); // replace address with admin wallet address
    if (!tx.events) {
      err = "Transaction Failed";
    }
    blockHash = tx.blockHash;
  } catch (error) {
    err = error.message;
  }
  return { err, blockHash };
};

const transferBnb = async (bnbvalue, public_key, private_key) => {
  let err = null;
  let blockHash = null;
  try {
    let signer = new ethers.Wallet(private_key, provider);
    const amount = await ethers.utils.parseEther(bnbvalue.toString());
    const tx = await (
      await signer.sendTransaction({
        to: public_key,
        value: amount,
        gasLimit: 300000,
      })
    ).wait();
    if (tx.status !== 1) {
      err = "Transaction Failed";
    }
    blockHash = tx.blockHash;
  } catch (error) {
    err = error.message;
  }
  return { err, blockHash };
};

const handleStake = async (bxgvalue, public_key, private_key) => {
  let signer = new ethers.Wallet(private_key, provider);
  const staking = new ethers.Contract(bitXStake.address, bitXStake.abi, signer);
  const bxg = new ethers.Contract(bitX.address, bitX.abi, signer);

  let err = null;
  let blockHash = null;
  let stakedId = null;
  try {
    const amount = ethers.utils.parseEther(bxgvalue);
    const amountApprove = ethers.utils.parseEther(
      "100000000000000000000000000000000000000000"
    );
    const value = await bxg.allowance(public_key, staking.address);
    if (value < amount) {
      await (
        await bxg.approve(staking.address, amountApprove, { gasLimit: 300000 })
      ).wait();
    }
    const tx = await (await staking.stake(amount)).wait();
    stakedId = tx.events[2].args.stakedId;
    stakedId = stakedId.toString();

    console.log(stakedId, "staid");
    console.log(tx.events);
    if (!tx.events) {
      console.log("err", "Stakig failed");
      err = "Staking Failed";
    }
    blockHash = tx.blockHash;
  } catch (error) {
    err = error.message;
  }
  return { err, blockHash, stakedId };
};

const handleClaim = async (bxgvalue1, stakingID, private_key) => {
  let err = null;
  let blockHash = null;
  try {
    let signer = new ethers.Wallet(private_key, provider);
    const staking = new ethers.Contract(
      bitXStake.address,
      bitXStake.abi,
      signer
    );

    const amount = await ethers.utils.parseEther(bxgvalue1.toString());
    // const stakingId = await ethers.utils.parseEther(stakingID.toString());
    const tx = await (
      await staking.claim(stakingID.toString(), { gasLimit: 300000 })
    ).wait(); //  replace this value
    if (!tx.events) {
      err = "Transaction Failed";
    }
    blockHash = tx.blockHash;
  } catch (error) {
    err = error.message;
  }

  return { err, blockHash };
};

const getChangedRatio = async () => {
  const bitxSwap = new ethers.Contract(
    bitXSwap.address,
    bitXSwap.abi,
    provider
  );
  const ratio = await bitxSwap.getRatio();

  return ethers.utils.formatUnits(ratio);
};

module.exports = {
  handleBuy,
  handleClaim,
  handleSell,
  handleStake,
  transferUsdt,
  handlerefer,
  transferBxg,
  transferBnb,
  getChangedRatio,
};
