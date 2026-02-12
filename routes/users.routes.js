const router = require("express").Router();
const UserModel = require("../models/User.model");
const bcrypt = require("bcryptjs");
const { isAuthenticated } = require("../middlewares/jwt.middleware");
const uploader = require("../middlewares/cloudinary.config");

// GET /users/me - Get the logged-in user's profile
router.get("/me", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    // Exclude passwordHash from the response
    const user = await UserModel.findById(userId).select("-passwordHash");
    console.log("User retrieved:", user);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

// PATCH /users/me - Update profile (email, social links, etc.)
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

// PATCH /users/me/password - Change password (requires old password)
router.patch("/me/password", isAuthenticated, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Check that both fields are provided
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ errorMessage: "All fields are required." });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ errorMessage: "New password must be at least 6 characters." });
    }

    // Get user with passwordHash included (not excluded)
    const user = await UserModel.findById(req.payload._id);

    // Verify old password matches the stored hash
    const isMatch = bcrypt.compareSync(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res
        .status(403)
        .json({ errorMessage: "Current password is incorrect." });
    }

    // Hash the new password and save it
    const salt = bcrypt.genSaltSync(12);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    await UserModel.findByIdAndUpdate(req.payload._id, {
      passwordHash: hashedPassword,
    });

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
});

// POST /users/me/profile-picture - Upload a new profile picture to Cloudinary
router.post(
  "/me/profile-picture",
  isAuthenticated,
  uploader.single("image"),
  async (req, res, next) => {
    try {
      const userId = req.payload._id;

      // req.file.path contains the Cloudinary URL after upload
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
