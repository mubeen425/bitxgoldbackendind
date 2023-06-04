const { DataTypes } = require("sequelize");
const connection = require("../utils/connection");
const moment = require("moment");
const Joi = require("joi");
const { User } = require("./user");

const Refers = connection.define(
  "refers",
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
    referer1_userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: "id",
      },
    },
    referer2_userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: "id",
      },
    },
    referer3_userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: "id",
      },
    },
    isRefered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "refers",
    timestamps: false,
  }
);

Refers.belongsTo(User, {
  as: "user",
  foreignKey: "user_id",
});
Refers.belongsTo(User, {
  as: "refer1_user",
  foreignKey: "referer1_userId",
});
Refers.belongsTo(User, {
  as: "refer2_user",
  foreignKey: "referer2_userId",
});
Refers.belongsTo(User, {
  as: "refer3_user",
  foreignKey: "referer3_userId",
});


function validatef(req) {
  const schema = Joi.object({
    user_id: Joi.required(),
    refer_code: Joi.required(),
  });

  return schema.validate(req);
}

module.exports = {
  Refers,
  validatef,
};
