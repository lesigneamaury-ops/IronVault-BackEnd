const router = require("express").Router();
const Cohort = require("../models/Cohort.model");
const UserModel = require("../models/User.model");

router.post("/create-cohort", (req, res) => {
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

router.get("/cohorts/:id", (req, res) => {
  const { cohortId } = req.params;
  Cohort.findById(cohortId, req.body, { new: true })
    .then((oneCohort) => {
      console.log("One Cohort retrieved");
      res.status(200).json(oneCohort);
    })
    .catch((error) => {
      console.log("Error retrieving Cohort");
      res.status(500).json({ errorMessage: error });
    });
});

router.get("/cohorts/:id/users", (req, res) => {
  const { id } = req.params;
  UserModel.find({ cohort: id })
    .then((users) => {
      console.log("Users in Cohort", users);
      res.status(200).json(users);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ errorMessage: error });
    });
});

module.exports = router;
