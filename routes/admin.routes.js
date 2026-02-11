const router = require("express").Router();
const Cohort = require("../models/Cohort.model");
const User = require("../models/User.model");
const Item = require("../models/Item.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

function isAdmin(req, res, next) {
  if (req.payload?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
}

router.get("/", isAuthenticated, isAdmin, (req, res) => {
  res.status(200).json({ message: "Admin API ready" });
});

router.get("/cohorts", isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const cohorts = await Cohort.find({}).sort({ year: -1, month: 1, course: 1 });
    res.status(200).json(cohorts);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/cohorts/:cohortId/students",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    try {
      const { cohortId } = req.params;
      const students = await User.find({ cohort: cohortId })
        .select("userName email profilePicture role socialLinks cohort")
        .sort({ userName: 1 });

      res.status(200).json(students);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/cohorts/:cohortId/items",
  isAuthenticated,
  isAdmin,
  async (req, res, next) => {
    try {
      const { cohortId } = req.params;
      const items = await Item.find({ cohort: cohortId })
        .populate("postedBy", "userName profilePicture")
        .sort({ createdAt: -1 });

      res.status(200).json(items);
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
