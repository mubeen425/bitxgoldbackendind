const { DataTypes } = require("sequelize");
const connection = require("../utils/connection");
const moment = require("moment");
const {User}=require("./user")
const Joi = require("joi");

const Bxg_history = connection.define(
  "bxg_history",
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
    blockhash: {
      type: DataTypes.STRING,
    },
    bxg: {
      type: DataTypes.FLOAT,
    },
    usdt: {
      type: DataTypes.FLOAT,
    },
    type: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "bxg_history",
    timestamps: true,
  }
);

Bxg_history.belongsTo(User, {
  as: "user",
  foreignKey: "user_id",
});

function validateS(req) {
  const schema = Joi.object({
    user_id: Joi.required(),
    bxg: Joi.required(),
    blockhash: Joi.required(),
    usdt: Joi.required(),
  });

  return schema.validate(req);
}

module.exports = {
  Bxg_history,
  validateS,
};
