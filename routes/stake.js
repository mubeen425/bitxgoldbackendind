const express = require("express");
const moment = require("moment");
const { Op, Sequelize } = require("sequelize");
const {User}=require("../models/user");
const { Bxg_token } = require("../models/bxg_token");
const { Refers } = require("../models/refers");
const { ReferReward } = require("../models/refer_reward");
const { StakeBxg, validateS } = require("../models/stake");
const { StakeHistory } = require("../models/stake_history");
const { DECRYPT } = require("../utils/constants");
const { handleStake, handleClaim } = require("../web3Integrations");
const { default: BigNumber } = require("bignumber.js");
const { Bxg_history } = require("../models/bxg_history");
const { getBxgBalance, getUsdtBalance, getBNBBalance } = require("../usdt_bxg_balance");
const { bnb_token } = require("../models/bnb_token");
const router = express.Router();
router.get("/getall", async (req, res) => {
  try {
    const getHistory = await StakeBxg.findAll({
      include: [
          {
            model: User,
            as: "user",
            attributes: [
              "user_name",
              "email",
              "contact",
              "wallet_public_key"
            ],
          },
        ],
  });

    return res.send(getHistory);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
});

router.get("/:user_id", async (req, res) => {
  try {
    if (!req.params.user_id)
      throw new Error("User id is missing.");
    const getStakeBxgByUserId = await StakeBxg.findOne({
      where: { user_id: req.params.user_id },
    });
    if (!getStakeBxgByUserId) return res.send({});

    return res.send(getStakeBxgByUserId);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { error } = validateS(req.body);
    if (error) throw new Error(error.details[0].message);
   const user=await User.findOne({
    where: {id:req.body.user_id}
  });
    const bxgt_stake = await StakeBxg.findOne({
      where: { user_id: req.body.user_id },
    });
    const bxg = await Bxg_token.findOne({
      where: { user_id: req.body.user_id },
    });
    const bnb=await bnb_token.findOne({
      where: { user_id: req.body.user_id },
    })
    if(!user) throw new Error("Invalid User.")
    if (!bxg) throw new Error("No Bxg Found In User Account.");
    if(BigNumber(bnb.bnb).isLessThanOrEqualTo(0)) throw new Error("Insufficient BNB For Transaction.")


    const stkrefer = await Refers.findOne({
      where: { user_id: req.body.user_id },
    });

    req.body.bxg = BigNumber(req.body.bxg).toFixed();

    if (req.body.bxg <= 0) throw new Error("Invalid StakeBxg Amount");
    if( BigNumber(bxg.bxg).isLessThan(req.body.bxg)) throw new Error("Insufficient Bxg Amount.")

  const {err,blockHash,stakedId}=await handleStake(req.body.bxg.toString(),user.wallet_public_key,DECRYPT(user.wallet_private_key));
if(!err){
  const bxgFBlock=await getBxgBalance(user.wallet_public_key);
  const bnbFBlock=await getBNBBalance(user.wallet_public_key);
      const updatedBxg=BigNumber(bxg.bxg).minus(req.body.bxg).toFixed();
  bxgt_stake.bxg = BigNumber(bxgt_stake.bxg).plus(req.body.bxg).toFixed();
  bxg.bxg =bxgFBlock?bxgFBlock:updatedBxg;
  bnb.bnb=bnbFBlock;
  await bnb.save()
  await bxg.save();
  await bxgt_stake.save();
   if (stkrefer?.isRefered) {
      const stkhist = await StakeHistory.findAll({
        where: { user_id: req.body.user_id },
      });
      if (stkhist.length === 0) {
        const lev1reward = req.body.bxg * 0.007;
        const lev2reward = req.body.bxg * 0.002;
        const lev3reward = req.body.bxg * 0.001;

        if (stkrefer.referer1_userId) {
          await ReferReward.create({
            user_id: req.body.user_id,
            referer_userId: stkrefer.referer1_userId,
            level: 1,
            reward: lev1reward,
          });
        }

        if (stkrefer.referer2_userId) {
          await ReferReward.create({
            user_id: req.body.user_id,
            referer_userId: stkrefer.referer2_userId,
            level: 2,
            reward: lev2reward,
          });
        }

        if (stkrefer.referer3_userId) {
          await ReferReward.create({
            user_id: req.body.user_id,
            referer_userId: stkrefer.referer3_userId,
            level: 3,
            reward: lev3reward,
          });
        }
      }
    }
  req.body.type = "stake";
  req.body.stake_id = stakedId;
  req.body.blockhash=blockHash;
  await StakeHistory.create(req.body);
  return res.status(200).send("Staked Successfully.");

}else{
  return res.status(400).send({ status: false, message: err });
}
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const stkhist = await StakeHistory.findOne({
      where: { id: req.params.id,type:'stake' },
    });
    if (!stkhist) throw new Error("Data Not Found.");

    const user=await  User.findOne({
      where: {id:stkhist.user_id}
    })

    const bxgt_stake = await StakeBxg.findOne({
      where: { user_id: stkhist.user_id },
    });
    const bxgt = await Bxg_token.findOne({
      where: { user_id: stkhist.user_id },
    });
    const bnb=await bnb_token.findOne({
      where: { user_id: stkhist.user_id },
    })
    if (!bxgt) throw new Error("No Bxg Found In User Account.");

    if (!bxgt_stake) throw new Error("Bxg stake not found.");
    if(BigNumber(bnb.bnb).isLessThanOrEqualTo(0)) throw new Error("Insufficient BNB For Transaction.")

    let bxg = BigNumber(stkhist.bxg).toFixed();

const {err,blockHash}=await handleClaim(stkhist.bxg.toString(),stkhist.stake_id,DECRYPT(user.wallet_private_key))
if(!err){
  const bxgFBlock=await getBxgBalance(user.wallet_public_key);
  // const updatedBxg=BigNumber(bxgt.bxg).plus( bxg).plus(req.body.reward).toFixed();
  const updatedBxg=BigNumber(bxgt.bxg).plus(req.body.reward).toFixed(); //update
  const bnbFBlock=await getBNBBalance(user.wallet_public_key);
    // stkhist.type = "claim";
    stkhist.stake_time=Sequelize.literal('CURRENT_TIMESTAMP')
    stkhist.blockhash=blockHash;
    // bxgt_stake.bxg =BigNumber(bxgt_stake.bxg).minus(bxg).toFixed();
   stkhist.reward = BigNumber(bxg).multipliedBy(0.03).toFixed();
    bxgt.bxg =bxgFBlock?bxgFBlock:updatedBxg;
    bnb.bnb=bnbFBlock
    bxgt_stake.total_claim_reward =BigNumber(bxgt_stake.total_claim_reward).plus(stkhist.reward).toFixed();
  await bxgt.save();
  await bnb.save()
    await bxgt_stake.save();
    await StakeHistory.create({
      user_id:stkhist.user_id,
      stake_id:stkhist.stake_id,
      bxg:stkhist.bxg,
      blockhash:stkhist.blockhash,
      type:'claim',
      reward:stkhist.reward,
      stake_time:stkhist.stake_time,
    });
    await stkhist.save();
    if (req.body.type == "claim") {

      const findRefered = await ReferReward.findAll({
        where: {
          [Op.and]: [
            { user_id: req.body.user_id },
            { type: "pending" },
          ],
        },
      });

      findRefered.forEach(async (re) => {
        const getReferedBxg = await Bxg_token.findOne({
          where: { user_id: re.referer_userId },
        });
        if (!getReferedBxg) {
          await Bxg_token.create({
            user_id: re.referer_userId,
            bxg: re.reward,
          });
        } else {
          getReferedBxg.bxg =BigNumber(getReferedBxg.bxg).plus(re.reward).toFixed();
          await getReferedBxg.save();
        }
        re.type = "claimed";
        re.save();
      });
    }
    return res.status(200).send("claimed ");
  }else{
    return res.status(400).send({ status: false, message: err });
  }
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
});

module.exports = router;
