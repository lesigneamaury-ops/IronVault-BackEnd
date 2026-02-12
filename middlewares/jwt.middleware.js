const jwt = require("jsonwebtoken");

// Middleware that checks if the user is logged in
// Reads the JWT token from the Authorization header, verifies it,
// and attaches the decoded data (user _id, role, cohortId) to req.payload
function isAuthenticated(req, res, next) {
  // Get the Authorization header from the request
  const authHeader = req.headers.authorization;

  // Check if header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ errorMessage: "No token provided" });
  }

  // Extract the token (everything after "Bearer ")
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ errorMessage: "Token missing" });
  }

  try {
    // Verify the token using the secret key from .env
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);

    // Attach decoded data to the request so route handlers can use it
    req.payload = decodedToken;
    next();
  } catch (err) {
    res.status(401).json({ errorMessage: "Invalid or expired token" });
  }
}

module.exports = { isAuthenticated };
