const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// 🔐 Authenticate user (check token)
exports.authenticate = (req, res, next) => {
  const authHeader =
    req.headers["authorization"] ||
    req.headers["Authorization"] ||
    req.headers["x-access-token"];

  if (!authHeader) {
    return res.status(401).send("Access denied. No token.");
  }

  let token = authHeader.replace(/^Bearer\s+/i, "").trim();
  token = token
    .replace(/^"(.+)"$/, "$1")
    .replace(/^'(.+)'$/, "$1")
    .trim();

  if (!token) {
    return res.status(401).send("Access denied. No token.");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // contains user_id + role
    next();
  } catch (err) {
    res.status(401).send("Invalid token");
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
