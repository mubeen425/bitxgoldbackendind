const { DataTypes,Sequelize } = require("sequelize");
const connection = require("../utils/connection");
const moment = require("moment");
const {User}=require("./user")
const Joi = require("joi");

const StakeHistory = connection.define(
  "stake_history",
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
    stake_id: {
      type: DataTypes.INTEGER,
    },
    bxg: {
      type: DataTypes.FLOAT,
    },
    blockhash: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING,
    },
    reward:{
      type:DataTypes.FLOAT,
    },
    stake_time: {
      type: DataTypes.DATE,
      defaultValue:Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    tableName: "stake_history",
    timestamps: false,
  }
);

StakeHistory.belongsTo(User,{
  as:'user',
  foreignKey: 'user_id',
})

function validateS(req) {
  const schema = Joi.object({
    stake_id: Joi.required(),
    bxg: Joi.required(),
    blockhash: Joi.required(),
    wallet_address: Joi.required(),
  });

  return schema.validate(req);
}

module.exports = {
  StakeHistory,
  validateS,
};
