const express = require("express");
const config = require("config");
const { Refers, validatef } = require("../models/refers");
const { User } = require("../models/user");
const malconnection = require("../utils/malconnection");

const router = express.Router();

router.get("/getall", async (req, res) => {
  try {
    const getHistory = await Refers.findAll();

    return res.send(getHistory);
  } catch (error) {
    return res.send({ message: error.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    if (!req.params.userId)
      throw new Error("User Id is missing.");
    const getByUserId = await Refers.findOne({
      where: { user_id: req.params.userId },
    });
    if (!getByUserId) return res.send({});

    return res.send(getByUserId);
  } catch (error) {
    return res.send({ message: error.message });
  }
});

router.get("/ow/:oldwallet_address", async (req, res) => {
  try {
    if (!req.params.oldwallet_address)
      throw new Error("wallet address is missing.");

    const getAllRequestsByUserId = await malconnection.query(
      `SELECT * FROM refers WHERE wallet_address = '${req.params.oldwallet_address}' LIMIT 1`,
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

    const checkrefer = await Refers.findOne({
      where: { user_id: req.body.user_id },
    });
    console.log(checkrefer);
    if (!checkrefer) throw new Error("Invalid User.");

    if (checkrefer.isRefered) throw new Error("Already Refered.");
    checkrefer.isRefered = true;

    const getOtherReferals = await User.findOne({
      where: { wallet_public_key: req.body.refer_code },
    });
    
    if (!getOtherReferals) throw new Error("Invalid Reference Code.");
    const getOtherReferalInRefers=await Refers.findOne({
      where: { user_id: getOtherReferals.id },
    });
    if(!getOtherReferalInRefers) throw new Error("Invalid Reference Code");
    
    if (checkrefer.user_id === getOtherReferals.id)
      throw new Error("Invalid Reference Code.");
    checkrefer.referer1_userId = getOtherReferalInRefers.user_id;
    checkrefer.referer2_userId = getOtherReferalInRefers.referer1_userId;
    checkrefer.referer3_userId = getOtherReferalInRefers.referer2_userId;

    const updatedrefer = await checkrefer.save();
    return res.send({ status: true, data: updatedrefer });
  } catch (error) {
    return res.send({ status: false, message: error.message });
  }
});

router.post("/check", async (req, res) => {
  try {
    const { error } = validatef(req.body);
    if (error) throw new Error(error.details[0].message);

    const checkrefer = await Refers.findOne({
      where: { user_id: req.body.user_id },
    });
    if (!checkrefer) throw new Error("Invalid Wallet.");

    if (checkrefer.isRefered) throw new Error("Already Refered.");
    checkrefer.isRefered = true;

    const getOtherReferals = await User.findOne({
      where: { wallet_public_key: req.body.refer_code },
    });
    if (!getOtherReferals) throw new Error("Invalid Reference Code.");
    const getOtherReferalInRefers=await Refers.findOne({
      where: { user_id: getOtherReferals.id },
    });
    if (checkrefer.user_id === getOtherReferals.id)
      throw new Error("Invalid Reference Code.");
    checkrefer.referer1_userId = getOtherReferalInRefers.user_id;
    checkrefer.referer2_userId = getOtherReferalInRefers.referer1_userId;
    checkrefer.referer3_userId = getOtherReferalInRefers.referer2_userId;

    return res.send({data:
      {refer1:checkrefer.referer1_userId,
      refer2:checkrefer.referer2_userId,
      refer3:checkrefer.referer3_userId,} });
  } catch (error) {
    return res.send({ status: false, message: error.message });
  }
});

module.exports = router;
