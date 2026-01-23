const router = require("express").Router();
const UserModel = require("../models/User.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

// router.get("/me", isAuthenticated, (req, res) => {
//   const userId = req.payload._id;
//   UserModel.findById(userId)
//     .then((user) => {
//       console.log("User retrieved:", user);
//       res.status(200).json(user);
//     })
//     .catch((error) => {
//       console.log("Error retrieving user:", error);
//       res.status(500).json({ errorMessage: error });
//     });
// });

router.get("/me", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const user = await UserModel.findById(userId).select("-passwordHash");
    console.log("User retrieved:", user);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

router.patch("/me", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { profilePicture, soclialLinks } = req.body;
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { profilePicture, soclialLinks },
      { new: true },
    ).select("-passwordHash");
    console.log("User updated:", updatedUser);
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
