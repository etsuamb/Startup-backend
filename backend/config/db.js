const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const dbPassword = process.env.DB_PASSWORD;
if (typeof dbPassword !== "string" || dbPassword.length === 0) {
  throw new Error(
    "DB_PASSWORD must be provided as a non-empty string in backend/.env or the environment.",
  );
}

const useSsl =
  process.env.DB_SSL === "true" ||
  (process.env.DB_HOST && String(process.env.DB_HOST).includes("render.com"));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: dbPassword,
  port: Number(process.env.DB_PORT) || 5432,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

module.exports = pool;
