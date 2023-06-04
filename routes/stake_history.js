const express = require("express");
const moment = require("moment");
const { StakeBxg, validateS } = require("../models/stake");
const { StakeHistory } = require("../models/stake_history");
const { User } = require("../models/user");
const router = express.Router();

router.get("/getall", async (req, res) => {
  try {
    const getHistory = await StakeHistory.findAll({
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
      throw new Error("user id is missing.");
    const getAllRequestsByUserId = await StakeHistory.findAll({
      where: { user_id: req.params.user_id },
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

    return res.send(getAllRequestsByUserId);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
});

module.exports = router;
