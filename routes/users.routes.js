const router = require("express").Router();
const UserModel = require("../models/User.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

router.get("/me", isAuthenticated, (req, res) => {
  const userId = req.payload._id;
  UserModel.findById(userId)
    .then((user) => {
      console.log("User retrieved:", user);
      res.status(200).json(user);
    })
    .catch((error) => {
      console.log("Error retrieving user:", error);
      res.status(500).json({ errorMessage: error });
    });
});

module.exports = router;
