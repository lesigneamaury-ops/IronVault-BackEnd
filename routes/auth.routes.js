const router = require("express").Router();
const UserModel = require("../models/User.model");
const Cohort = require("../models/Cohort.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

router.post("/signup", async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ errorMessage: "Password must be at least 6 characters long." });
    }

    const userAlreadyInDB = await UserModel.findOne({ email });
    if (userAlreadyInDB) {
      return res.status(403).json({ errorMessage: "Invalid Credentials" });
    }

    const theSalt = bcrypt.genSaltSync(12);
    const hashedPassword = bcrypt.hashSync(password, theSalt);

    const createdUser = await UserModel.create({
      userName: name,
      email,
      passwordHash: hashedPassword,
    });

    // Return a token directly so the frontend doesn't need a second request
    const payload = {
      _id: createdUser._id,
      role: createdUser.role,
      cohortId: createdUser.cohort,
    };
    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "48h",
    });

    res.status(201).json({ message: "Account created!", authToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: "Signup failed. Please try again." });
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
  try {
    const currentLoggedInUser = await UserModel.findById(
      req.payload._id,
    ).select("-passwordHash");
    res.status(200).json({ message: "Token is valid", currentLoggedInUser });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
