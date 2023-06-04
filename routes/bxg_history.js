const express = require("express");
const config = require("config");
const { Bxg_token, validateS } = require("../models/bxg_token");
const { Bxg_history } = require("../models/bxg_history");
const { User } = require("../models/user");
const router = express.Router();

router.get("/getall", async (req, res) => {
  try {
    const getHistory = await Bxg_history.findAll({
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
    if (!req.params.user_id) throw new Error("user id is missing.");
    const getAllRequestsByUserId = await Bxg_history.findAll({
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
