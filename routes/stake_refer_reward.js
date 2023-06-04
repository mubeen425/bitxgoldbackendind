const express = require("express");
const config = require("config");
const { ReferReward } = require("../models/refer_reward");
const { User } = require("../models/user");
const malconnection = require("../utils/malconnection");

const router = express.Router();

router.get("/getall", async (req, res) => {
  try {
    const getHistory = await ReferReward.findAll(
      {
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
      }
    );

    return res.send(getHistory);
  } catch (error) {
    return res.send({ message: error.message });
  }
});

router.get("/:user_id", async (req, res) => {
  try {
    if (!req.params.user_id)
      throw new Error("user id is missing.");
    const getAllRequestsByUserId = await ReferReward.findAll({
      where: { referer_userId: req.params.user_id },
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

    return res.send(getAllRequestsByUserId);
  } catch (error) {
    return res.send({ message: error.message });
  }
});

router.get("/ow/:oldwallet_address", async (req, res) => {
  try {
    if (!req.params.oldwallet_address)
      throw new Error("wallet address is missing.");

    const getAllRequestsByUserId = await malconnection.query(
      `SELECT * FROM refer_reward WHERE refer_code = '${req.params.oldwallet_address}'`,
    );

    return res.send(getAllRequestsByUserId);
  } catch (error) {
    return res.send({ message: error.message });
  }
});

module.exports = router;
