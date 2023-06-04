const express = require("express");
const router = express.Router();
const { User, validate } = require("../models/user");
const { ENCRYPT_PASSWORD, COMPARE_PASSWORD } = require("../utils/constants");
const IsAdminOrUser = require("../middlewares/AuthMiddleware");
const multerImageHandler = require("../middlewares/multermiddleware");
const cloudinary = require("../utils/cloudinaryuploader");
const Joi = require("joi");
const { default: BigNumber } = require("bignumber.js");
const { StakeBxg } = require("../models/stake");
const { Bxg_history } = require("../models/bxg_history");
const { Bxg_token } = require("../models/bxg_token");
const { getChangedRatio } = require("../web3Integrations");
router.use(IsAdminOrUser);

router.get("/getratio", async (req, res) => {
  try {
    const ratio=await getChangedRatio();

    return res.send({ratio:ratio});
  } catch (error) {
    return res.send(error.message);
  }
});


router.get("/getall", async (req, res) => {
  try {
    const users = await User.findAll();
    if (!users.length > 0) return res.send({ message: "no users found" });

    return res.send(users);
  } catch (error) {
    return res.send(error.message);
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const getHistory = await User.findAll();

    let allProfilesWithBxg =[];
    let totalBxgAvailable=0;
    for (const prof of getHistory) {
      const findBxg = await Bxg_token.findOne({
        where: { user_id: prof.id },
      });
      totalBxgAvailable= BigNumber(totalBxgAvailable).plus(findBxg?findBxg.bxg:0).toFixed();
      allProfilesWithBxg.push({
        wallet_address: prof.wallet_public_key,
        email: prof.email,
        contact: prof.contact,
        bxg: findBxg?findBxg.bxg:0,
      });
    }
    
    const totalClaimReward = await StakeBxg.sum("total_claim_reward");
    const totalBxgStaked = await StakeBxg.sum("bxg");
    const totalBxgBought = await Bxg_history.sum("bxg",{
      where:{type:'Bought'}
    });
    const userCount=allProfilesWithBxg.length;
    return res.send({allProfilesData:allProfilesWithBxg,
      userCount:userCount,totalBxgAvailable:totalBxgAvailable,
      totalClaimReward:totalClaimReward?totalClaimReward:0,
      totalBxgStaked:totalBxgStaked,
      totalBxgBought:totalBxgBought
    });
  } catch (error) { 
    return res.send({ message: error.message });
  }
});

router.get("/:user_id", async (req, res) => {
  try {
    if (!req.params.user_id)
      return res.status(400).send("user id is required.");
    const user = await User.findOne({ where: { id: req.params.user_id } });
    if (!user) return res.status(404).send("no users found");

    return res.send(user);
  } catch (error) {
    return res.send(error.message);
  }
});

router.put(
  "/img/:user_id",
  multerImageHandler.single("image"),
  async (req, res) => {
    try {
      if (!req.params.user_id) return res.status(400).send("user is required.");
      //   if (!req.body.image) return res.status(404).send("Please Provide Image.");

      const checkUser = await User.findOne({
        where: { id: req.params.user_id },
      });
      if (!checkUser)
        return res.status(404).send("User Not Found With The Given Id.");

      const cloudinaryLink = await cloudinary.uploader.upload(req.file.path);
      checkUser.avatar = cloudinaryLink.secure_url;

      await checkUser.save();
      return res.send("profile picture updated.");
    } catch (error) {
      return res.send(error.errors[0]);
    }
  }
);

router.put("/passwordchange/:user_id", async (req, res) => {
  try {
    if (!req.params.user_id)
      return res.status(400).send("Please Provide User Id.");
    const { error } = passValidate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const checkUser = await User.findOne({ where: { id: req.params.user_id } });
    if (!checkUser)
      return res.status(404).send("User Not Found With The Given Id.");

    const validPassword = await COMPARE_PASSWORD(
      req.body.password,
      checkUser.password
    );
    if (!validPassword) return res.status(400).send("Incorrect  Password.");
    const newPassword = await ENCRYPT_PASSWORD(req.body.new_password);
    checkUser.password = newPassword;
    await checkUser.save();

    return res.send("Password Updated.");
  } catch (error) {
    return res.send(error.message);
  }
});

router.put("/:user_id", async (req, res) => {
  try {
    const { error } = validateFieldsToUpdate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    if (req.body.user_name) {
      let checkUsername = await User.findOne({
        where: { user_name: req.body.user_name },
      });
      if (checkUsername)
        return res.status(400).send("User Name is already taken.");
    }
    if (req.body.email) {
      let checkEmail = await User.findOne({
        where: { email: req.body.email },
      })
      if (checkEmail) {
        return res.status(400).send("User already registered with this email.")
      }else{
        req.body.is_email_verified=false;
      }
    }
    const checkUser = await User.findOne({ where: { id: req.params.user_id } });
    if (!checkUser)
      return res.status(404).send("User Not Found With The Given Id.");

    await User.update(
      { ...req.body },
      { returning: true, where: { id: req.params.user_id } }
    );
    return res.send("values updated");
  } catch (error) {
    return res.send(error.message);
  }
});

const passValidate = (req) => {
  const schema = Joi.object({
    password: Joi.string().required(),
    new_password: Joi.string()
      .min(5)
      .max(255)
      .required()
      .regex(
        RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[,./#?!@$%^&*-])(?=.{8,})"
        )
      )
      .message(
        "Password must contain at least one uppercase one lowercase one special character and one number "
      )
      .invalid(Joi.ref("password")),
  });

  return schema.validate(req);
};

function validateFieldsToUpdate(req) {
  const schema = Joi.object({
    user_name: Joi.string().optional().min(5).max(255),
    contact: Joi.string().optional(),
    email: Joi.string().email().optional(),
    old_wallet_public_key:Joi.string().optional()
  });

  return schema.validate(req);
}




module.exports = router;
