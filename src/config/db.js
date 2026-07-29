const mysql = require("mysql2/promise");
require("dotenv").config();

// ========================================================================
// CONEXIÓN A MARIADB / MYSQL
// ========================================================================
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "catastro_app",
  password: process.env.DB_PASS || "123456",
  database: process.env.DB_NAME || "catastro_culiacan_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = db;
