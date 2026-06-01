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
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30_000,
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10_000,
  keepAlive: true,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Render Postgres may terminate idle connections; without this handler Node can crash.
pool.on("error", (err) => {
  console.error("PostgreSQL pool idle client error:", err.message || err);
});

module.exports = pool;
