const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ========================
// REGISTER
// ========================
exports.register = async (req, res) => {
  const { first_name, last_name, email, password, role } = req.body;

  try {
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, first_name, last_name, email, role`,
      [first_name, last_name, email, hashedPassword, role || "user"]
    );

    return res.status(201).json({
      message: "User registered successfully 🚀",
      user: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ========================
// LOGIN
// ========================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful 🔐",
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};