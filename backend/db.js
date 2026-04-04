const { Pool } = require("pg");

const pool = new Pool({
  host: "shortline.proxy.rlwy.net",
  port: 34425,
  user: "postgres",
  password: "qIQZrgwGDJvkjejkgPPHyNObPlEVEeOZ",
  database: "railway",
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;