const router = require("express").Router();
const UserModel = require("../models/User.model");
const Cohort = require("../models/Cohort.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

// POST /auth/signup - Create a new user account
router.post("/signup", async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    // Validate password length (minimum 6 characters)
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ errorMessage: "Password must be at least 6 characters long." });
    }

    // Check if email is already taken
    const userAlreadyInDB = await UserModel.findOne({ email });
    if (userAlreadyInDB) {
      return res.status(403).json({ errorMessage: "Invalid Credentials" });
    }

    // Hash the password with bcrypt (12 salt rounds)
    const theSalt = bcrypt.genSaltSync(12);
    const hashedPassword = bcrypt.hashSync(password, theSalt);

    // Create the user in the database
    const createdUser = await UserModel.create({
      userName: name,
      email,
      passwordHash: hashedPassword,
    });

    // Create a JWT token and return it directly (no second login needed)
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

// POST /auth/login - Log in with email and password
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Find the user by email
    const userAlreadyInDB = await UserModel.findOne({ email });
    if (!userAlreadyInDB) {
      return res.status(403).json({ errorMessage: "Invalid Credentials" });
    } else {
      // Compare the plain password with the stored hash
      const doesPasswordMatch = bcrypt.compareSync(
        password,
        userAlreadyInDB.passwordHash,
      );
      if (!doesPasswordMatch) {
        res.status(403).json({ errorMessage: "Invalid Credentials" });
      } else {
        // Create a JWT token with user info
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

// GET /auth/verify - Check if the current token is still valid
router.get("/verify", isAuthenticated, async (req, res) => {
  try {
    // Return user data without the password hash
    const currentLoggedInUser = await UserModel.findById(
      req.payload._id,
    ).select("-passwordHash");
    res.status(200).json({ message: "Token is valid", currentLoggedInUser });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
