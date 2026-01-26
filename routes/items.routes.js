const router = require("express").Router();
const Item = require("../models/Item.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");
const uploader = require("../middlewares/cloudinary.config");

router.post(
  "/create-item",
  isAuthenticated,
  uploader.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const caption = req.body.caption || "";

      let taggedUsers = [];
      if (req.body.taggedUsers) {
        try {
          const parsed = JSON.parse(req.body.taggedUsers);
          if (Array.isArray(parsed)) taggedUsers = parsed;
        } catch (e) {
          taggedUsers = [];
        }
      }

      const newItem = await Item.create({
        imageUrl: req.file.path,
        caption,
        taggedUsers,
        postedBy: req.payload._id,
        likes: [],
        cohort: req.payload.cohortId,
      });

      res.status(201).json(newItem);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/liked", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;

    const items = await Item.find({
      likes: userId,
    })
      .populate("postedBy", "userName")
      .populate("taggedUsers", "userName")
      .sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
});

router.get("/tagged", isAuthenticated, async (req, res, next) => {
  try {
    const items = await Item.find({ taggedUsers: req.payload._id })
      .populate("postedBy", "userName")
      .populate("taggedUsers", "userName")
      .sort({ createdAt: -1 });
    console.log("Tagged items", items);
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const items = await Item.find({ cohort: req.payload.cohortId })
      .populate("postedBy", "userName")
      .populate("taggedUsers", "userName")
      .sort({ createdAt: -1 });
    console.log("All items", items);
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/:itemId", isAuthenticated, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId)
      .populate("postedBy", "userName")
      .populate("taggedUsers", "userName");
    console.log("Item retrieved", item);
    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
});

router.patch("/:itemId", isAuthenticated, async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ errorMessage: "Item not found" });
    }

    const isAuthor = String(item.postedBy) === String(req.payload._id);
    const isAdmin = req.payload.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Action not allowed" });
    }

    const update = {};

    if (req.body.caption !== undefined) {
      update.caption = req.body.caption;
    }

    if (req.body.taggedUsers !== undefined) {
      let taggedUsers = [];

      if (Array.isArray(req.body.taggedUsers)) {
        taggedUsers = req.body.taggedUsers;
      } else if (typeof req.body.taggedUsers === "string") {
        try {
          const parsed = JSON.parse(req.body.taggedUsers);
          if (Array.isArray(parsed)) taggedUsers = parsed;
        } catch (e) {
          taggedUsers = req.body.taggedUsers
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }

      update.taggedUsers = taggedUsers;
    }

    const updatedItem = await Item.findByIdAndUpdate(itemId, update, {
      new: true,
      runValidators: true,
    })
      .populate("postedBy", "userName")
      .populate("taggedUsers", "userName");

    res.status(200).json(updatedItem);
  } catch (error) {
    next(error);
  }
});

router.patch("/:itemId/like", isAuthenticated, async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.payload._id;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ errorMessage: "Item not found" });
    }

    // TOGGLE LIKE
    if (item.likes.includes(userId)) {
      const unLikedItem = await Item.findByIdAndUpdate(
        itemId,
        { $pull: { likes: userId } },
        { new: true, runValidators: true },
      );

      return res.status(200).json(unLikedItem);
    }

    const likedItem = await Item.findByIdAndUpdate(
      itemId,
      { $push: { likes: userId } },
      { new: true, runValidators: true },
    );

    return res.status(200).json(likedItem);
  } catch (error) {
    next(error);
  }
});

router.delete("/:itemId", isAuthenticated, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);
    const isAuthor = String(item.postedBy) === String(req.payload._id);
    const isAdmin = req.payload.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Action not allowed" });
    }
    await Item.findByIdAndDelete(req.params.itemId);
    res.status(200).json({ message: "Item deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
