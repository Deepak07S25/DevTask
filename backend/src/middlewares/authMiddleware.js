const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;

  // 1. Check if the token exists in the Headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from string "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify the token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "supersecretkey",
      );

      // 3. Attach the User ID to the request so controllers can use it
      req.user = decoded.userId;

      next(); // Move to the next function (the Controller)
    } catch (error) {
      res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ error: "Not authorized, no token" });
  }
};

module.exports = { protect };
