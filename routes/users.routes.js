const router = require("express").Router();
const UserModel = require("../models/User.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");
const uploader = require("../middlewares/cloudinary.config");

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

    const { userName, email, profilePicture, socialLinks } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        userName,
        email,
        profilePicture,
        socialLinks,
      },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/me/profile-picture",
  isAuthenticated,
  uploader.single("image"),
  async (req, res, next) => {
    try {
      const userId = req.payload._id;

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { profilePicture: req.file.path },
        { new: true },
      ).select("-passwordHash");

      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
