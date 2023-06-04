// require("./startup/updateDepositHistory")().catch((error) => {
//   console.error(error);
//   process.exit(1);
// });
const updateBalance=require("./startup/balanceUpdate")
const express = require("express");
const app = express();
app.set("view engine", "pug");
require("./startup/routes")(app);
require("./startup/db")();

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("listening on port " + port);
});


setInterval(() => {
  updateBalance();
}, 12000);
