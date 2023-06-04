const express = require("express");
const config = require("config");
const { Bxg_token, validateS } = require("../models/bxg_token");
const { Bxg_history } = require("../models/bxg_history");
const { Bonus_refer } = require("../models/bonus_refer");
const { BonusReferReward } = require("../models/bonus_refer_reward");
const { Op } = require("sequelize");
const { Usdt_token } = require("../models/usdt_token");
const { User } = require("../models/user");
const {
  handleBuy,
  handleSell,
  transferUsdt,
  handlerefer,
  transferBxg,
} = require("../web3Integrations");
const { DECRYPT } = require("../utils/constants");
const { default: BigNumber } = require("bignumber.js");
const {
  getBxgBalance,
  getUsdtBalance,
  getBNBBalance,
} = require("../usdt_bxg_balance");
const { bnb_token } = require("../models/bnb_token");
const { Refers } = require("../models/refers");
const router = express.Router();

router.get("/getall", async (req, res) => {
  try {
    const getHistory = await Bxg_token.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_name", "email", "contact", "wallet_public_key"],
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
    if (!req.params.user_id) throw new Error("user id is missing.");
    const getBxgByUserId = await Bxg_token.findOne({
      where: { user_id: req.params.user_id },
    });
    if (!getBxgByUserId) return res.send({});
    return res.send(getBxgByUserId);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
});

router.post("/buy", async (req, res) => {
  try {
    const { error } = validateS(req.body);
    if (error) throw new Error(error.details[0].message);

    const user = await User.findOne({
      where: { id: req.body.user_id },
    });
    const bxgt = await Bxg_token.findOne({
      where: { user_id: req.body.user_id },
    });
    const usdt = await Usdt_token.findOne({
      where: {
        user_id: req.body.user_id,
      },
    });
    const bnb = await bnb_token.findOne({
      where: { user_id: req.body.user_id },
    });
    const bonusrefer = await Bonus_refer.findOne({
      where: {
        user_id: req.body.user_id,
      },
      include: [
        {
          model: User,
          as: "refererUser",
          attributes: ["id", "wallet_public_key"],
        },
      ],
    });

    if (req.body.bxg <= 0) throw new Error("Invalid BXG Amount");
    if (req.body.usdt <= 0) throw new Error("Invalid USDT Amount.");
    if (BigNumber(bnb.bnb).isLessThanOrEqualTo(0))
      throw new Error("Insufficient BNB For Transaction.");
    if (BigNumber(req.body.usdt).isGreaterThan(usdt.usdt))
      throw new Error("Insufficient USDT Amount.");

    if (bonusrefer?.isRefered) {
      const bxghist = await Bxg_history.findAll({
        where: {
          [Op.and]: [{ user_id: req.body.user_id }, { type: "Bought" }],
        },
      });
      if (bxghist.length === 0) {
        const stkrefer = await Refers.findOne({
          where: { user_id: req.body.user_id },
          include: [
            {
              model: User,
              as: "refer1_user",
              attributes: ["wallet_public_key"],
              required: false,
            },
            {
              model: User,
              as: "refer2_user",
              attributes: ["wallet_public_key"],
              required: false,
            },
            {
              model: User,
              as: "refer3_user",
              attributes: ["wallet_public_key"],
              required: false,
            },
          ],
        });
        const referalAddressarray = [
          stkrefer?.refer1_user?.wallet_public_key
            ? stkrefer?.refer1_user?.wallet_public_key
            : "0x0000000000000000000000000000000000000000",
          stkrefer?.refer2_user?.wallet_public_key
            ? stkrefer?.refer2_user?.wallet_public_key
            : "0x0000000000000000000000000000000000000000",
          stkrefer?.refer3_user?.wallet_public_key
            ? stkrefer?.refer3_user?.wallet_public_key
            : "0x0000000000000000000000000000000000000000",
        ];
        const err = await handlerefer(
          referalAddressarray,
          bonusrefer.refererUser.wallet_public_key,
          user.wallet_public_key,
          DECRYPT(user.wallet_private_key)
        );
        const calreward = req.body.usdt * 0.1;
        if (err) throw new Error(err);
        const brr = await BonusReferReward.create({
          user_id: req.body.user_id,
          referer_userId: bonusrefer.refererUser.id,
          reward: calreward,
        });
        const bonusReferUser = await Usdt_token.findOne({
          where: {
            user_id: bonusrefer.refererUser.id,
          },
        });
        bonusReferUser.usdt = BigNumber(bonusReferUser.usdt)
          .plus(calreward)
          .toFixed();
        await bonusReferUser.save();
      }
    }

    const { err, blockHash } = await handleBuy(
      req.body.bxg.toString(),
      user.wallet_public_key,
      DECRYPT(user.wallet_private_key)
    );
    if (!err) {
      const bxgFBlock = await getBxgBalance(user.wallet_public_key);
      const usdtFBlock = await getUsdtBalance(user.wallet_public_key);
      const bnbFBlock = await getBNBBalance(user.wallet_public_key);
      const updatedBxg = BigNumber(bxgt.bxg).plus(req.body.bxg).toFixed();
      const updatedUsdt = BigNumber(usdt.usdt).minus(req.body.usdt).toFixed();
      bxgt.bxg = bxgFBlock ? bxgFBlock : updatedBxg;
      usdt.usdt = usdtFBlock ? usdtFBlock : updatedUsdt;
      bnb.bnb = bnbFBlock;
      req.body.blockhash = blockHash;
      req.body.type = "Bought";
      await bxgt.save();
      await usdt.save();
      await bnb.save();
      await Bxg_history.create(req.body);
      return res.send("Purchasing Successfull.");
    } else {
      return res.status(400).send({ status: false, message: err });
    }
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
});

router.post("/sell", async (req, res) => {
  try {
    if (!req.body.bxg) throw new Error("Bxg value missing");

    const user = await User.findOne({
      where: { id: req.body.user_id },
    });

    const bxgt = await Bxg_token.findOne({
      where: { user_id: req.body.user_id },
    });

    const bnb = await bnb_token.findOne({
      where: { user_id: req.body.user_id },
    });
    if (!bxgt) throw new Error("Bxg not found.");
    let bxg = BigNumber(req.body.bxg).toFixed();
    console.log(BigNumber(bxgt.bxg).toFixed(), bxg, "bxgcomp");
    if (bxg <= 0) throw new Error("Invalid Bxg Value.");
    if (BigNumber(bxgt.bxg).isLessThan(bxg))
      throw new Error("Bxg value exceeded.");
    if (BigNumber(bnb.bnb).isLessThanOrEqualTo(0))
      throw new Error("Insufficient BNB For Transaction.");

    const { err, blockHash } = await handleSell(
      bxg.toString(),
      user.wallet_public_key,
      DECRYPT(user.wallet_private_key)
    );
    if (!err) {
      const bxgFBlock = await getBxgBalance(user.wallet_public_key);
      const bnbFBlock = await getBNBBalance(user.wallet_public_key);
      const updatedBxg = BigNumber(bxgt.bxg).minus(bxg).toFixed();
      bxgt.bxg = bxgFBlock ? bxgFBlock : updatedBxg;
      bnb.bnb = bnbFBlock;
      await bnb.save();
      await bxgt.save();
    } else {
      return res.status(400).send(err);
    }
    req.body.type = "sell_pending";
    await Bxg_history.create(req.body);
    return res.status(200).send("Sold Successfuly.");
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
});

router.put("/sellUpdate/:id", async (req, res) => {
  try {
    if (!req.params.id) throw new Error("type value missing");
    if (!req.body.type) throw new Error("Type Is Missing.");

    const adminUser = await User.findOne({
      where: {
        is_admin: true,
      },
    });
    const bxghist = await Bxg_history.findOne({
      where: { id: req.params.id },
    });
    if (!bxghist) throw new Error("Invalid Data.");
    const user = await User.findOne({
      where: {
        id: bxghist.user_id,
      },
    });

    if (!user) throw new Error("Invalid User.");
    if (!adminUser) throw new Error("Admin Account Is Not Configured.");

    const bxgt = await Bxg_token.findOne({
      where: { user_id: bxghist.user_id },
    });
    const usdt = await Usdt_token.findOne({
      where: {
        user_id: bxghist.user_id,
      },
    });
    const bnb = await bnb_token.findOne({
      where: { user_id: bxghist.user_id },
    });

    const adminBxg = await Bxg_token.findOne({
      where: { user_id: adminUser.id },
    });
    const adminUsdt = await Usdt_token.findOne({
      where: {
        user_id: adminUser.id,
      },
    });
    const adminBnb = await bnb_token.findOne({
      where: { user_id: adminUser.id },
    });

    if (!bxgt) throw new Error("Bxg not found.");
    if (!usdt) throw new Error("Usdt not found.");

    if (req.body.type === "sell_accepted") {
      const { err, blockHash } = await transferUsdt(
        bxghist.usdt.toString(),
        user.wallet_public_key,
        config.get("adminPrivateAdd")
      );
      if (!err) {
        const bxgFBlock = await getBxgBalance(user.wallet_public_key);
        const usdtFBlock = await getUsdtBalance(user.wallet_public_key);
        const bnbFBlock = await getBNBBalance(user.wallet_public_key);
        const updatedUsdt = BigNumber(usdt.usdt).plus(bxghist.usdt).toFixed();

        const bxgFBlockAd = await getBxgBalance(config.get("adminPublicAdd"));
        const usdtFBlockAd = await getUsdtBalance(config.get("adminPublicAdd"));
        const bnbFBlockAd = await getBNBBalance(config.get("adminPublicAdd"));

        adminUsdt.usdt = usdtFBlockAd;
        adminBnb.bnb = bnbFBlockAd = bnbFBlockAd;
        bxgt.bxg = bxgFBlock;
        usdt.usdt = usdtFBlock ? usdtFBlock : updatedUsdt;
        bnb.bnb = bnbFBlock;
        bxghist.blockhash = blockHash;
        await adminUsdt.save();
        await adminBnb.save();
        await usdt.save();
        await bxgt.save();
        await bnb.save();
      } else {
        return res.status(400).send({ status: false, message: err });
      }
    }
    if (req.body.type === "sell_rejected") {
      const { err, blockHash } = await transferBxg(
        bxghist.bxg.toString(),
        user.wallet_public_key,
        config.get("adminPrivateAdd")
      );
      if (!err) {
        const bxgFBlock = await getBxgBalance(user.wallet_public_key);
        const usdtFBlock = await getUsdtBalance(user.wallet_public_key);
        const bnbFBlock = await getBNBBalance(user.wallet_public_key);
        const updatedUsdt = BigNumber(usdt.usdt).plus(bxghist.usdt).toFixed();

        const bxgFBlockAd = await getBxgBalance(config.get("adminPublicAdd"));
        const usdtFBlockAd = await getUsdtBalance(config.get("adminPublicAdd"));
        const bnbFBlockAd = await getBNBBalance(config.get("adminPublicAdd"));

        adminBxg.bxg = bxgFBlockAd;
        adminBnb.bnb = bnbFBlockAd = bnbFBlockAd;

        bxgt.bxg = bxgFBlock;
        usdt.usdt = usdtFBlock ? usdtFBlock : updatedUsdt;
        bnb.bnb = bnbFBlock;
        bxghist.blockhash = blockHash;
        await adminBxg.save();
        await adminBnb.save();
        await usdt.save();
        await bxgt.save();
        await bnb.save();
      } else {
        return res.status(400).send({ status: false, message: err });
      }
    }
    bxghist.type = req.body.type;
    await bxghist.save();
    return res
      .status(200)
      .send({ status: true, message: "Request Processed Successfully." });
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
});

module.exports = router;
