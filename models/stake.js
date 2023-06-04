const { DataTypes } = require("sequelize");
const connection = require("../utils/connection");
const {User}=require("./user")
const moment = require("moment");
const Joi = require("joi");

const StakeBxg = connection.define(
  "stake_bxg",
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
    bxg: {
      type: DataTypes.FLOAT,
    },
    total_claim_reward: {
      type: DataTypes.FLOAT,
    },
  },
  {
    tableName: "stake_bxg",
    timestamps: false,
  }
);

StakeBxg.belongsTo(User,{
  as:'user',
  foreignKey: 'user_id',
})

function validateS(req) {
  const schema = Joi.object({
    user_id:Joi.required(),
    bxg: Joi.required()
  });

  return schema.validate(req);
}

module.exports = {
  StakeBxg,
  validateS,
};
