const express = require("express");
const { Usdt_token } = require("../models/usdt_token");
const { User } = require("../models/user");
const router = express.Router();


router.get("/getall", async (req, res) => {
  try {
    const getHistory = await Usdt_token.findAll({
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
    const getUsdtByUserId = await Usdt_token.findOne({
      where: { user_id: req.params.user_id },
    });
    if (!getUsdtByUserId) return res.send({});
    return res.send(getUsdtByUserId);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
});

module.exports =router;