const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;

  // 1. Check if the token exists in Cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to check if the token exists in the Headers (backward compatibility)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      // 3. Verify the token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "supersecretkey",
      );

      // 4. Attach the User ID to the request so controllers can use it
      req.user = decoded.userId;

      return next(); // Move to the next function (the Controller)
    } catch (error) {
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }
};
module.exports = { protect };
