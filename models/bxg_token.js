const { DataTypes } = require("sequelize");
const connection = require("../utils/connection");
const {User}=require('./user');
const moment = require("moment");

const Joi = require("joi");

const Bxg_token = connection.define(
  "bxg_token",
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
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "bxg_token",
    timestamps: false,
  }
);

Bxg_token.belongsTo(User, {
  as: "user",
  foreignKey: "user_id",
});

function validateS(req) {
  const schema = Joi.object({
    user_id: Joi.required(),
    bxg: Joi.required(),
    usdt: Joi.required(),
  });

  return schema.validate(req);
}

module.exports = {
  Bxg_token,
  validateS,
};
