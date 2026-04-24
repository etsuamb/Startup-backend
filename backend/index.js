const express = require("express");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(express.json());

// ✅ Routes FIRST
app.use("/api/auth", authRoutes);

// Test DB connection
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connected ✅",
      time: result.rows[0],
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Start server LAST
app.listen(5000, () => {
  console.log("Server running on port 5000");
});

const testRoutes = require("./routes/testRoutes");

app.use("/api/test", testRoutes);

const startupRoutes = require("./routes/startupRoutes");

app.use("/api/startups", startupRoutes);