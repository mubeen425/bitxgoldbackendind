const morgan = require("morgan");
const express = require("express");
const cors = require("cors");
const authRouter = require("../routes/Auth");
const userRouter=require("../routes/user")
const bxgRouter = require("../routes/bxg_token");
const usdtRouter=require("../routes/usdt_token")
const bnbRouter=require("../routes/bnb_token");
const bxgHistoryRouter = require("../routes/bxg_history");
const stakeHistoryRouter = require("../routes/stake_history");
const stakeRouter = require("../routes/stake");
const referRouter = require("../routes/refer");
const bonusReferRouter = require("../routes/bonus_refer");
const bonusReferRewardRouter = require("../routes/bonus_refer_reward");
const stakeReferRewardRouter = require("../routes/stake_refer_reward");
const profileRouter=require("../routes/user");
const withdrawCryptoRouter=require("../routes/withdraw_crypto");
const depositCryptoRouter=require("../routes/deposit_crypto_history");
const IsUser = require("../middlewares/AuthMiddleware");

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

module.exports = function (app) {
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static('images'));
  app.use(morgan("tiny"));
  app.get("/", async (req, res) => {
    res.send("working");
  });
  app.use("/api/auth", authRouter);
  app.use("/api/refer", referRouter);
  app.use("/api/bonusrefer", bonusReferRouter);
  app.use(IsUser);
  app.use("/api/user",userRouter);
  app.use("/api/withdrawcrypto",withdrawCryptoRouter)
  app.use("/api/depositcrypto",depositCryptoRouter)
  app.use("/api/bxg", bxgRouter);
  app.use("/api/usdt",usdtRouter);
  app.use("/api/bnb",bnbRouter);
  app.use("/api/bxghistory", bxgHistoryRouter);
  app.use("/api/stake", stakeRouter);
  app.use("/api/profile",profileRouter)
  app.use("/api/stakehistory", stakeHistoryRouter);
  app.use("/api/bonusrefreward", bonusReferRewardRouter);
  app.use("/api/stakerefreward", stakeReferRewardRouter);
};
