const jwt = require("jsonwebtoken");

const JWT_SECRET = "your_secret_key";

// 🔐 Authenticate user (check token)
exports.authenticate = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).send("Access denied. No token.");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // contains user_id + role
    next();
  } catch (err) {
    res.status(400).send("Invalid token");
  }
};

// 🔒 Authorize roles (THIS is the one you asked about)
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).send("Access denied");
    }
    next();
  };
};