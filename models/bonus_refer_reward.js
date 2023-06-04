const { DataTypes } = require("sequelize");
const connection = require("../utils/connection");
const moment = require("moment");
const Joi = require("joi");
const { User } = require("./user");

const BonusReferReward = connection.define(
  "bonus_refer_reward",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: "id",
      },
    },
    referer_userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: "id",
      },
    },
    reward: {
      type: DataTypes.FLOAT,
    },
  },
  {
    tableName: "bonus_refer_reward",
    timestamps: true,
  }
);

BonusReferReward.belongsTo(User, {
  as: "user",
  foreignKey: "user_id",
});

BonusReferReward.belongsTo(User, {
  as: "refererUser",
  foreignKey: "referer_userId",
});



function validatef(req) {
  const schema = Joi.object({
    wallet_address: Joi.required(),
    refer_code: Joi.required(),
    reward:Joi.required()
  });

  return schema.validate(req);
}

module.exports = {
  BonusReferReward,
  validatef,
};
