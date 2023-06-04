const config = require("config");
const express = require("express");
const ethers = require("ethers");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { User, validate } = require("../models/user");
const {
  ENCRYPT_PASSWORD,
  COMPARE_PASSWORD,
  ENCRYPT,
} = require("../utils/constants");
const send = require("../utils/mailsend");
const { Refers } = require("../models/refers");
const { Bonus_refer } = require("../models/bonus_refer");
const { Bxg_token } = require("../models/bxg_token");
const { Usdt_token } = require("../models/usdt_token");
const { StakeBxg } = require("../models/stake");
const {
  getUsdtBalance,
  getBxgBalance,
  getBNBBalance,
} = require("../usdt_bxg_balance");
const connection = require("../utils/connection");
const { bnb_token } = require("../models/bnb_token");
const malconnection = require("../utils/malconnection");

router.post("/verifywallet", async (req, res) => {
  try {
    if (!req.body.wallet_address) throw new Error("invalid account");

    const user = await malconnection.query(`SELECT * FROM profile WHERE wallet_address='${req.body.wallet_address}'`);
   console.log(user)
    if (user[0].length === 0) throw new Error("user not found.");

    return res.send({ status: true, message: "valid." });
  } catch (error) {
    return res.status(404).send({ status: false, message: error.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) throw new Error(error.details[0].message);

    let checkUsername = await User.findOne({
      where: { user_name: req.body.user_name },
    });

    if (checkUsername) throw new Error("User Name is already taken.");

    let user = await User.findOne({ where: { email: req.body.email } });
    if (user) throw new Error("User already registered with this gmail.");

    req.body.password = await ENCRYPT_PASSWORD(req.body.password);

    const wallet = ethers.Wallet.createRandom();
    req.body.wallet_public_key = wallet.address;
    req.body.wallet_private_key = ENCRYPT(wallet.privateKey);
    req.body.wallet_mnemonic_phrase = ENCRYPT(wallet.mnemonic.phrase);

    const createUser = await User.create(req.body);
    await Bxg_token.create({
      user_id: createUser.id,
      bxg: parseFloat(0),
    });
    await Usdt_token.create({
      user_id: createUser.id,
      usdt: parseFloat(0),
    });
    await bnb_token.create({
      user_id: createUser.id,
      bnb: parseFloat(0),
    });
    await StakeBxg.create({
      user_id: createUser.id,
      bxg: parseFloat(0),
      total_claim_reward: parseFloat(0),
    });

    await Bonus_refer.create({
      user_id: createUser.id,
    });
    await Refers.create({
      user_id: createUser.id,
    });
    let id = jwt.sign({ id: createUser.id }, config.get("jwtPrivateKey"), {
      expiresIn: "15m",
    });
    send(createUser.email, "Email Confirmation", "normal", id,res,true);
  } catch (error) {
    return res.send({ status: false, message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    let user = await User.findOne({ where: { email: req.body.email } });
    if (!user) throw new Error("Invalid email or password.");

    const validPassword = await COMPARE_PASSWORD(
      req.body.password,
      user.password
    );
    if (!validPassword) throw new Error("Invalid email or password.");
    if (!user.is_email_verified) throw new Error("Email is not verified.");
    const usdt = await getUsdtBalance(
      user.is_admin ? config.get("adminPublicAdd") : user.wallet_public_key
    );
    const bxg = await getBxgBalance(
      user.is_admin ? config.get("adminPublicAdd") : user.wallet_public_key
    );
    const bnb = await getBNBBalance(
      user.is_admin ? config.get("adminPublicAdd") : user.wallet_public_key
    );

    await connection.query(`
  UPDATE bxg_token
  SET bxg = ${bxg}
  WHERE user_id = ${user.id}
`);

    await connection.query(`
  UPDATE usdt_token
  SET usdt = ${usdt}
  WHERE user_id = ${user.id}
`);
    await connection.query(`
  UPDATE bnb_token
  SET bnb = ${bnb}
  WHERE user_id = ${user.id}
`);
    const token = user.generateJwtToken();
    return res.send({ status: true, access: token });
  } catch (error) {
    return res.send({ status: false, message: error.message });
  }
});

router.post("/email-verify", async (req, res) => {
  try {
    if (!req.body.email) throw new Error("please provide email.");

    const checkUser = await User.findOne({ where: { email: req.body.email } });
    if (!checkUser) throw new Error("User Not Found With This Email.");
    let id = jwt.sign({ id: checkUser.id }, config.get("jwtPrivateKey"), {
      expiresIn: "15m",
    });
    const error=send(
      checkUser.email,
      req.body.type ? "Forgot Password" : "Email Confirmation",
      req.body.type ? req.body.type : "normal",
      id,
      res
    );
  } catch (error) {
    return res.send({ status: false, message: error.message });
  }
});

router.post("/passwordreset/:user_id", async (req, res) => {
  try {
    if (!req.params.user_id) return res.status(400).send("user id is missing.");
    jwt.verify(req.body.token, config.get("jwtPrivateKey"));

    const checkUser = await User.findOne({ where: { id: req.params.user_id } });
    if (!checkUser)
      return res.status(404).send("User Not Found With The Given Id.");

    const newPassword = await ENCRYPT_PASSWORD(req.body.password);
    checkUser.password = newPassword;
    await checkUser.save();
    if (req.body.forgot) {
      return res.render("emailconfirm", {
        title: "forgot password",
        status: "Password Updated..",
        icon: "t",
      });
    }
    return res.send("Password Updated..");
  } catch (error) {
    return res.render("emailconfirm", {
      title: "error",
      status: error.message,
      icon: "c",
    });
  }
});

router.get("/verify/:token", async (req, res) => {
  try {
    if (!req.params.token)
      return res.status(400).send({ message: "Token is missing." });
    let tok = jwt.verify(req.params.token, config.get("jwtPrivateKey"));
    let user = await User.findOne({ where: { id: tok.id } });
    if (!user) return res.status(400).send("Link Expired..");
    if (user.is_email_verified) {
      return res.render("emailconfirm", {
        title: "Verified.",
        status: "Email Is Already Verified..",
        icon: "t",
      });
    } else {
      user.is_email_verified = true;
      await user.save();
    }

    return res.render("emailconfirm", {
      title: "Verified.",
      status: "Email Verified..",
      icon: "t",
    });
  } catch (error) {
    console.log(error.message);
    return res.render("emailconfirm", {
      title: "Expired",
      status: "Link Expired..",
      icon: "c",
    });
  }
});

router.get("/forgotform/:token", async (req, res) => {
  try {
    if (!req.params.token)
      return res.status(400).send({ message: "Token is missing." });
    let tok = jwt.verify(req.params.token, config.get("jwtPrivateKey"));
    let user = await User.findOne({ where: { id: tok.id } });
    if (!user) return res.status(400).send("Invalid Link");
    return res.render("forgotpass", { id: user.id, token: req.params.token });
  } catch (error) {
    console.log(error.message);
    return res.render("emailconfirm", {
      title: "Expired",
      status: "Link Expired",
      icon: "c",
    });
  }
});

module.exports = router;
