const { bnb_token } = require('../models/bnb_token');
const { Bxg_token } = require('../models/bxg_token');
const { Usdt_token } = require('../models/usdt_token');
const { User } = require("../models/user");
const { DECRYPT } = require("../utils/constants");
const config = require("config");
const { getBxgBalance, getBNBBalance, getUsdtBalance } = require('../usdt_bxg_balance');

module.exports = async () => {
  try {
  const getAllUsers = await User.findAll();
  if (getAllUsers.length > 1) {
    getAllUsers.forEach(async (usr) => {
      const usrId = usr.id;
      const usrBxg = await getBxgBalance(
        usr.is_admin ? config.get("adminPublicAdd") : usr.wallet_public_key
      );
      const usrUsdt = await getUsdtBalance(
        usr.is_admin ? config.get("adminPublicAdd") : usr.wallet_public_key
      );
      const usrBnb = await getBNBBalance(
        usr.is_admin ? config.get("adminPublicAdd") : usr.wallet_public_key
      );

      const updateUserBxg = await Bxg_token.findOne({
        where: { user_id: usrId },
      });
      const updateUserUsdt = await Usdt_token.findOne({
        where: { user_id: usrId },
      });
      const updateUserBnb = await bnb_token.findOne({
        where: { user_id: usrId },
      });

      if (updateUserBxg) {
        updateUserBxg.bxg = usrBxg
          ? usrBxg
          : updateUserBxg.bxg;
          updateUserBxg.save();
      }
      if (updateUserUsdt) {
        updateUserUsdt.usdt = usrUsdt
          ? usrUsdt
          : updateUserUsdt.usdt;
          updateUserUsdt.save();
      }

      if (updateUserBnb) {
        updateUserBnb.bnb = usrBnb
          ? usrBnb
          : updateUserBnb.bnb;
          updateUserBnb.save();
      }
    });
  }
} catch (error) {
//  console.log(error.message)   
}
};
