const router = require("express").Router();
const Cohort = require("../models/Cohort.model");
const UserModel = require("../models/User.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

// POST /cohorts/create-cohort - Create a new cohort
router.post("/create-cohort", isAuthenticated, (req, res) => {
  Cohort.create(req.body)
    .then((newCohort) => {
      console.log("Cohort created:", newCohort);
      res.status(201).json(newCohort);
    })
    .catch((error) => {
      console.log("Error creating cohort:");
      res.status(500).json({ errorMessage: error });
    });
});

// GET /cohorts/cohorts - Get all cohorts
router.get("/cohorts", (req, res) => {
  Cohort.find({})
    .then((cohorts) => {
      console.log("All Cohorts", cohorts);
      res.status(200).json(cohorts);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ errorMessage: error });
    });
});

// GET /cohorts/cohorts/:id - Get one cohort by ID
router.get("/cohorts/:id", (req, res) => {
  const { id } = req.params;
  Cohort.findById(id, req.body, { new: true })
    .then((oneCohort) => {
      console.log("One Cohort retrieved");
      res.status(200).json(oneCohort);
    })
    .catch((error) => {
      console.log("Error retrieving Cohort");
      res.status(500).json({ errorMessage: error });
    });
});

// GET /cohorts/me/students - Get all students in the logged-in user's cohort
router.get("/me/students", isAuthenticated, async (req, res, next) => {
  try {
    const users = await UserModel.find({ cohort: req.payload.cohortId })
      .select("userName email profilePicture cohort socialLinks")
      .sort({ userName: 1 });

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

// GET /cohorts/cohorts/:id/users - Get all users in a specific cohort
router.get("/cohorts/:id/users", isAuthenticated, (req, res) => {
  const { id } = req.params;
  UserModel.find({ cohort: id })
    // Exclude password hash from the response
    .select("-passwordHash")
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ errorMessage: error });
    });
});

module.exports = router;
