const config = require("config");
const { Sequelize } = require("sequelize");
const { DATABASE, USERNAME, PASSWORD, HOST, PORT } = config.get("MALDBCONFIG");

const poolConfig = {
  max: 10, // Maximum number of connections in the pool
  min: 0, // Minimum number of connections in the pool
  acquire: 30000, // Maximum time (in milliseconds) to acquire a connection from the pool
  idle: 10000, // Maximum time (in milliseconds) that a connection can be idle in the pool before it is released
};

module.exports = new Sequelize(DATABASE, USERNAME, PASSWORD, {
  host: HOST,
  dialect: "mysql",
  logging: false,
  dialectOptions: {
    connectTimeout: 30000
  },
  pool:poolConfig,
  port: PORT,
});
