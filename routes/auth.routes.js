const router = require("express").Router();
const UserModel = require("../models/User.model");
const Cohort = require("../models/Cohort.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

router.post("/signup", async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    const userAlreadyInDB = await UserModel.findOne({ email });
    if (userAlreadyInDB) {
      return res.status(403).json({ message: "Invalid Credentials" });
    } else {
      const theSalt = bcrypt.genSaltSync(12);

      const hashedPassword = bcrypt.hashSync(password, theSalt);

      //this is the object that will be saved in the DB
      const hashedUser = {
        userName: name,
        email,
        passwordHash: hashedPassword,
      };

      const createdUser = await UserModel.create(hashedUser);

      res.status(201).json(createdUser);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: error });
  }
});

router.get("/verify", isAuthenticated, async (req, res) => {
  const currentloggedInUser = await UserModel.findById(req.payload._id).select(
    "-password - email",
  );
  res.status(200).json({ message: "Token is valid", currentloggedInUser });
});

module.exports = router;
