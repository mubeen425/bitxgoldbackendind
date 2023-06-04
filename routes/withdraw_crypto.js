const express = require("express");
const config = require("config");
const { default: BigNumber } = require("bignumber.js");
const { User } = require("../models/user");
const IsAdminOrUser = require("../middlewares/AuthMiddleware");
const { WithdrawCrypto, validateDC } = require("../models/withdraw_crypto");
const { DECRYPT } = require("../utils/constants");
const {
  getBxgBalance,
  getBNBBalance,
  getUsdtBalance,
} = require("../usdt_bxg_balance");
const { Bxg_token } = require("../models/bxg_token");
const { transferBxg, transferUsdt, transferBnb } = require("../web3Integrations");
const { bnb_token } = require("../models/bnb_token");
const { Usdt_token } = require("../models/usdt_token");
const router = express.Router();
router.use(IsAdminOrUser);

router.get("/", async (req, res) => {
  try {
    const getAllRequests = await WithdrawCrypto.findAll({
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
    return res.send(getAllRequests);
  } catch (error) {
    return res.send({ message: error.message });
  }
});

router.get("/:user_id", async (req, res) => {
  try {
    const getAllRequestsByUserId = await WithdrawCrypto.findAll({
      where: { user_id: req.params.user_id },
      order: [["requested_at", "DESC"]],
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
    const History = getAllRequestsByUserId.map((history, index) => {
      return {
        ...history.toJSON(),
        count: index + 1,
      };
    });

    return res.send(History);
  } catch (error) {
    return res.send({ message: error.message });
  }
});

router.post("/bxg", async (req, res) => {
  try {
    const { error } = validateDC(req.body);
    if (error) throw new Error(error.details[0].message);

    const checkIfUser = await User.findOne({ where: { id: req.body.user_id } });
    if (!checkIfUser) throw new Error("user not found.");

    const userBxg = await Bxg_token.findOne({
      where: { user_id: req.body.user_id },
    });
    const userBnb=await bnb_token.findOne({
      where: { user_id: req.body.user_id },
    })
    if (!userBxg) throw new Error("Bxg not found.");
    if (req.body.amount <= 0) throw new Error("Invalid Amount");

    if(BigNumber(userBxg.bxg).isLessThan(req.body.amount)) throw new Error("Insufficient BXG Balance.")
    if(BigNumber(userBnb.bnb).isLessThanOrEqualTo(0)) throw new Error("Insufficient BNB For Transaction.")

    let admin_public_key = config.get("adminPublicAdd");
    let admin_private_key = config.get("adminPrivateAdd");

    let user_public_key = checkIfUser.wallet_public_key;
    let private_key = DECRYPT(checkIfUser.wallet_private_key);
    let withdraw_public_key = req.body.wallet_address;

    if (user_public_key === withdraw_public_key)
      throw new Error("please enter a different wallet address");

    const { err, blockHash } = await transferBxg(
      req.body.amount.toString(),
      withdraw_public_key,
      checkIfUser.is_admin? admin_private_key: private_key
    );
    if (!err) {
      
      const bxgFBlock = await getBxgBalance(user_public_key);
      const usdtFBlock = await getUsdtBalance(user_public_key);
      const bnbFBlock=await getBNBBalance(user_public_key);
      const updatedBxg = BigNumber(userBxg).minus(req.body.amount).toFixed();
       userBxg.bxg=bxgFBlock?bxgFBlock:updatedBxg;
       userBnb.bnb=bnbFBlock;
       userBxg.save();
       userBnb.save();
    }
    else{
      return res.status(400).send({ message: err })
    }
    req.body.blockhash=blockHash;
    req.body.token_name="BXG"
    await WithdrawCrypto.create(req.body);
    return res.send({status:true,message:"withdraw successful."});
  } catch (error) {
    return res.status(404).send({ message: error.message });
  }
});

router.post("/usdt", async (req, res) => {
  try {
    const { error } = validateDC(req.body);
    if (error) throw new Error(error.details[0].message);

    const checkIfUser = await User.findOne({ where: { id: req.body.user_id } });
    if (!checkIfUser) throw new Error("user not found.");

    const userUsdt = await Usdt_token.findOne({
      where: { user_id: req.body.user_id },
    });
    const userBnb=await bnb_token.findOne({
      where: { user_id: req.body.user_id },
    })
    if (!userUsdt) throw new Error("Usdt not found.");
    if (req.body.amount <= 0) throw new Error("Invalid Amount");
    if(BigNumber(userUsdt.usdt).isLessThan(req.body.amount)) throw new Error("Insufficient USDT Balance.")
    if(BigNumber(userBnb.bnb).isLessThanOrEqualTo(0)) throw new Error("Insufficient BNB For Transaction.")


    let admin_public_key = config.get("adminPublicAdd");
    let user_public_key = checkIfUser.wallet_public_key;
    let private_key = DECRYPT(checkIfUser.wallet_private_key);
    let withdraw_public_key = req.body.wallet_address;

    if (user_public_key === withdraw_public_key)
      throw new Error("wallet address is same as your account,please provide a different address.");

    const { err, blockHash } = await transferUsdt(
      req.body.amount.toString(),
      withdraw_public_key,
      checkIfUser.is_admin? admin_private_key: private_key
    );
    if (!err) {
      const usdtFBlock = await getUsdtBalance(user_public_key);
      const bnbFBlock=await getBNBBalance(user_public_key);
      const updatedUsdt = BigNumber(userUsdt).minus(req.body.amount).toFixed();
       userUsdt.usdt=usdtFBlock?usdtFBlock:updatedUsdt;
       userBnb.bnb=bnbFBlock;
       userUsdt.save();
       userBnb.save();
    }
    else{
      return res.status(400).send({ message: err })
    }
    req.body.blockhash=blockHash;
    req.body.token_name="USDT"
    await WithdrawCrypto.create(req.body);
    return res.send({status:true,message:"withdraw successful."});
  } catch (error) {
    return res.status(404).send({ message: error.message });
  }
});

router.post("/bnb", async (req, res) => {
  try {
    const { error } = validateDC(req.body);
    if (error) throw new Error(error.details[0].message);

    const checkIfUser = await User.findOne({ where: { id: req.body.user_id } });
    if (!checkIfUser) throw new Error("user not found.");

    const userBnb=await bnb_token.findOne({
      where: { user_id: req.body.user_id },
    })
    if (!userBnb) throw new Error("Usdt not found.");
    if (req.body.amount <= 0) throw new Error("Invalid Amount");
    if(BigNumber(userBnb.bnb).isLessThan(req.body.amount)) throw new Error("Insufficient BNB Balance.")


    let admin_public_key = config.get("adminPublicAdd");
    let user_public_key = checkIfUser.wallet_public_key;
    let private_key = DECRYPT(checkIfUser.wallet_private_key);
    let withdraw_public_key = req.body.wallet_address;

    if (user_public_key === withdraw_public_key)
      throw new Error("wallet address is same as your account,please provide a different address.");

    const { err, blockHash } = await transferBnb(
      req.body.amount.toString(),
      withdraw_public_key,
      checkIfUser.is_admin? admin_private_key: private_key
    );
    if (!err) {
      const bnbFBlock=await getBNBBalance(user_public_key);
      const updatedBnb = BigNumber(userBnb.bnb).minus(req.body.amount).toFixed();
       userBnb.bnb=bnbFBlock?bnbFBlock:updatedBnb;
       userBnb.save();
    }
    else{
      return res.status(400).send({ message: err })
    }
    req.body.blockhash=blockHash;
    req.body.token_name="BNB"
    await WithdrawCrypto.create(req.body);
    return res.send({status:true,message:"withdraw successful."});
  } catch (error) {
    return res.status(404).send({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const checkIfExist = await WithdrawCrypto.findOne({
      where: {
        id: req.params.id,
      },
    });
    if (!checkIfExist) return res.status(404).send("not found");

    await checkIfExist.destroy();
    return res.send("deleted successfuly");
  } catch (error) {
    return res.send(error.message);
  }
});

module.exports = router;
