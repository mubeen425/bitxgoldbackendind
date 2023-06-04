const jwt = require("jsonwebtoken");
const config=require("config")
module.exports = function (req, res, next) {
  if (!req.headers.authorization)
    return res.send("authentication token required");
  console.log(req.headers["authorization"]);
  try {
    const decodetoken = jwt.verify(req.headers.authorization, config.get("jwtPrivateKey"));
    req.user = decodetoken;
    console.log(decodetoken);
    if (decodetoken.is_admin || decodetoken.is_active) {
      next();
    } else {
      return res.status(400).send("Invalid Token");
    }
  } catch (error) {
    return res.status(400).send("invalid token");
  }
};
