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
      const userObj = createdUser.toObject();
      delete userObj.passwordHash;
      res.status(201).json(userObj);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: error });
  }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const userAlreadyInDB = await UserModel.findOne({ email });
    if (!userAlreadyInDB) {
      return res.status(403).json({ errorMessage: "Invalid Credentials" });
    } else {
      const doesPasswordMatch = bcrypt.compareSync(
        password,
        userAlreadyInDB.passwordHash,
      );
      if (!doesPasswordMatch) {
        res.status(403).json({ errorMessage: "Invalid Credentials" });
      } else {
        const payload = {
          _id: userAlreadyInDB._id,
          role: userAlreadyInDB.role,
          cohortId: userAlreadyInDB.cohort,
        };
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "48h",
        });
        res.status(200).json({ message: "You are logged in!", authToken });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: error });
  }
});

router.get("/verify", isAuthenticated, async (req, res) => {
  const currentloggedInUser = await UserModel.findById(req.payload._id).select(
    "-passwordHash -email",
  );
  res.status(200).json({ message: "Token is valid", currentloggedInUser });
});

module.exports = router;
