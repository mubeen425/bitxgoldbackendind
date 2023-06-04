const { DataTypes } = require("sequelize");
const connection = require("../utils/connection");
const moment = require("moment");
const Joi = require("joi");
const { User } = require("./user");

const Bonus_refer = connection.define(
  "bonus_refer",
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
    isRefered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "bonus_refer",
    timestamps: false,
  }
);

Bonus_refer.belongsTo(User, {
  as: "user",
  foreignKey: "user_id",
});

Bonus_refer.belongsTo(User, {
  as: "refererUser",
  foreignKey: "referer_userId",
});

function validatef(req) {
  const schema = Joi.object({
    user_id: Joi.required(),
    refer_code: Joi.required(),
  });

  return schema.validate(req);
}

module.exports = {
  Bonus_refer,
  validatef,
};
