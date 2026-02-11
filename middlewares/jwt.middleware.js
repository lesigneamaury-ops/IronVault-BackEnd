const jwt = require("jsonwebtoken");

function isAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ errorMessage: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ errorMessage: "Token missing" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    req.payload = decodedToken;
    next();
  } catch (err) {
    res.status(401).json({ errorMessage: "Invalid or expired token" });
  }
}

module.exports = { isAuthenticated };
