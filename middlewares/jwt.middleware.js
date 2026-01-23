const jwt = require("jsonwebtoken");

function isAuthenticated(req, res, next) {
  if (
    req.headers.authorization.split(" ")[0] === "Bearer" &&
    req.headers.authorization.split(" ")[1]
  ) {
    const theTokenInHeader = req.headers.authorization.split(" ")[1];
    try {
      const decodedToken = jwt.verify(
        theTokenInHeader,
        process.env.TOKEN_SECRET,
      );
      req.payload = decodedToken;
      next();
    } catch (err) {
      res.status(403).json({ ErrorMessage: "Invalid Token" });
    }
  } else {
    res.status(403).json({ ErrorMessage: "Header Malformed" });
  }
}

module.exports = { isAuthenticated };
