const connection = require("../utils/connection");
const malconnection=require("../utils/malconnection")
module.exports = function () {
  try {
    connection.authenticate().then(() => console.log("connected to database")).catch(err=>console.log("ind error",err));
    malconnection.authenticate().then(() => console.log("connected to malaysian database")).catch(err=>console.log("mal err",err));
    // connection
    //   .sync({ alter: true })
    //   .then(() => console.log("synced successfully"));
  } catch (error) {
    console.error("enable to connect to database");
  }
};
