const { DataTypes } = require("sequelize");
const connection = require("../utils/connection");
const moment = require("moment");
const Joi = require("joi");
const { User } = require("./user");

const ReferReward = connection.define(
  "refer_reward",
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
    level:{
        type:DataTypes.INTEGER
    },
    reward: {
      type: DataTypes.FLOAT,
    },
    type:{
      type:DataTypes.STRING,
      defaultValue:'pending',
    }
  },
  {
    tableName: "refer_reward",
    timestamps: true,
  }
);

ReferReward.belongsTo(User, {
  as: "user",
  foreignKey: "user_id",
});

ReferReward.belongsTo(User, {
  as: "refererUser",
  foreignKey: "referer_userId",
});

function validatef(req) {
  const schema = Joi.object({
    wallet_address: Joi.required(),
    refer_code: Joi.required(),
    level:Joi.required(),
    reward:Joi.required()
  });

  return schema.validate(req);
}

module.exports = {
  ReferReward,
  validatef,
};
