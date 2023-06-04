const { DataTypes } = require("sequelize");
const connection = require("../utils/connection");
const moment = require("moment");
const {User}=require("./user");
const Joi = require("joi");

const bnb_token = connection.define(
  "bnb_token",
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
    bnb: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "bnb_token",
    timestamps: false,
  }
);


bnb_token.belongsTo(User, {
  as: "user",
  foreignKey: "user_id",
});

module.exports = {
  bnb_token,
};
