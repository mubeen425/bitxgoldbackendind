const { DataTypes } = require("sequelize");
const connection = require("../utils/connection");
const moment = require("moment");
const {User}=require("./user");
const Joi = require("joi");

const Usdt_token = connection.define(
  "usdt_token",
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
    usdt: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "usdt_token",
    timestamps: false,
  }
);


Usdt_token.belongsTo(User, {
  as: "user",
  foreignKey: "user_id",
});

module.exports = {
  Usdt_token,
};
