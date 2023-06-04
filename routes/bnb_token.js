const express = require("express");
const { bnb_token } = require("../models/bnb_token");
const { User } = require("../models/user");
const router = express.Router();

router.get("/getall", async (req, res) => {
  try {
    const getHistory = await bnb_token.findAll({
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
    const getBnbByUserId = await bnb_token.findOne({
      where: { user_id: req.params.user_id },
    });
    if (!getBnbByUserId) return res.send({});
    return res.send(getBnbByUserId);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
});

module.exports = router;
