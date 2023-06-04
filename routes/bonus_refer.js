const express = require("express");
const config = require("config");
const { Bonus_refer, validatef } = require("../models/bonus_refer");
const { User } = require("../models/user");
const malconnection = require("../utils/malconnection");

const router = express.Router();

router.get("/getall", async (req, res) => {
  try {
    const getHistory = await Bonus_refer.findAll({
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
          {
            model: User,
            as: "refererUser",
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
    return res.send({ message: error.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    if (!req.params.userId)
      throw new Error("User Id  is missing.");
    const getRequestByUserId = await Bonus_refer.findOne({
      where: { user_id: req.params.userId },
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
          {
            model: User,
            as: "refererUser",
            attributes: [
              "user_name",
              "email",
              "contact",
              "wallet_public_key"
            ],
          },
        ],
    });
    if (!getRequestByUserId) return res.send({});

    return res.send(getRequestByUserId);
  } catch (error) {
    return res.send({ message: error.message });
  }
});

router.get("/ow/:oldwallet_address", async (req, res) => {
  try {
    if (!req.params.oldwallet_address)
      throw new Error("wallet address is missing.");

    const getAllRequestsByUserId = await malconnection.query(
      `SELECT * FROM bonus_refer WHERE wallet_address = '${req.params.oldwallet_address}' LIMIT 1`,
    );

    if (!getAllRequestsByUserId || getAllRequestsByUserId.length === 0) {
      return res.send({});
    }

    return res.send(getAllRequestsByUserId[0]);
  } catch (error) {
    return res.send({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { error } = validatef(req.body);
    if (error) throw new Error(error.details[0].message);
    
    const checkrefer = await Bonus_refer.findOne({
      where: { user_id: req.body.user_id },
    });
    if (!checkrefer) throw new Error("Invalid Address.");

    const getOtherReferals = await User.findOne({
      where: { wallet_public_key: req.body.refer_code },
    });
    if (!getOtherReferals) throw new Error("Invalid Reference Code.");

    if (checkrefer.isRefered) throw new Error("Already Refered.");
    if (checkrefer.user_id === getOtherReferals.id)
      throw new Error("Invalid Reference Code.");
    checkrefer.isRefered = true;
    checkrefer.referer_userId = getOtherReferals.id;

    await checkrefer.save();
    return res.send("Refere Added Successfully.");
  } catch (error) {
    return res.send({ status: false, message: error.message });
  }
});

router.post("/check", async (req, res) => {
  try {
    if (!req.body.wallet_address)
        throw new Error("wallet address is missing.");
    
    const checkInUser=await User.findOne({
          where:{wallet_public_key:req.body.wallet_address}
        })

  if (!checkInUser) return res.status(400).send({status:false,refer_code:req.body.wallet_address});

    const checkByUserId = await Bonus_refer.findOne({
      where: { user_id: checkInUser.id },
    });

    if (!checkByUserId) return res.status(400).send({status:false,refer_code:req.body.user_id});

    return res.send({status:true,refer_code:checkByUserId.user_id});
  } catch (error) {
    return res.send({status:false, message: error.message });
  }
});

module.exports = router;
