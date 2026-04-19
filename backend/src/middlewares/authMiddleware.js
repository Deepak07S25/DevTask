const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  // Hard-fail immediately if JWT_SECRET is not configured — prevents token forgery
  // via known fallback secrets. env.js already call process.exit(1) in production,
  // but this is a second, request-level safety net.
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "Server misconfiguration: auth secret not set" });
  }

  let token;

  // 1. Check if the token exists in the Headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // 2. Fallback to check if the token exists in Cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      // 3. Verify the token — no fallback secret, strict enforcement
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Attach the User ID to the request so controllers can use it
      req.user = decoded.userId;

      return next();
    } catch (error) {
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }
};
module.exports = { protect };
