const router = require("express").Router();
const Item = require("../models/Item.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");
const uploader = require("../middlewares/cloudinary.config");

// POST /items/create-item - Upload a new image to the gallery
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

      const newItem = await Item.create({
        imageUrl: req.file.path,
        caption,
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

// GET /items/liked - Get all items the current user has liked
router.get("/liked", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;

    const items = await Item.find({
      likes: userId,
    })
      .populate("postedBy", "userName")
      .sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
});

// GET /items - Get all items for the user's cohort
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const items = await Item.find({ cohort: req.payload.cohortId })
      .populate("postedBy", "userName")
      .sort({ createdAt: -1 });
    console.log("All items", items);
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
});

// GET /items/:itemId - Get one item by ID
router.get("/:itemId", isAuthenticated, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId).populate(
      "postedBy",
      "userName",
    );
    console.log("Item retrieved", item);
    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
});

// PATCH /items/:itemId - Update caption (only author or admin)
router.patch("/:itemId", isAuthenticated, async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ errorMessage: "Item not found" });
    }

    // Authorization check: only the author or an admin can edit
    const isAuthor = String(item.postedBy) === String(req.payload._id);
    const isAdmin = req.payload.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Action not allowed" });
    }

    const update = {};

    if (req.body.caption !== undefined) {
      update.caption = req.body.caption;
    }

    const updatedItem = await Item.findByIdAndUpdate(itemId, update, {
      new: true,
      runValidators: true,
    }).populate("postedBy", "userName");

    res.status(200).json(updatedItem);
  } catch (error) {
    next(error);
  }
});
// PATCH /items/:itemId/reactions - Toggle an emoji reaction on an item
router.patch("/:itemId/reactions", isAuthenticated, async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { emoji } = req.body;
    const userId = req.payload._id;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ errorMessage: "Item not found" });
    }

    // Check if this emoji reaction already exists on the item
    const entryIndex =
      item.reactions?.findIndex((r) => r.emoji === emoji) ?? -1;

    if (entryIndex >= 0) {
      const entry = item.reactions[entryIndex];
      const userIncluded = entry.users.some(
        (u) =>
          String(u) === String(userId) ||
          String(u?._id || u) === String(userId),
      );

      if (userIncluded) {
        // User already reacted -> remove their reaction
        item.reactions[entryIndex].users = entry.users.filter(
          (u) =>
            String(u) !== String(userId) &&
            String(u?._id || u) !== String(userId),
        );
        // If no users left on this emoji, remove the entry entirely
        if (item.reactions[entryIndex].users.length === 0) {
          item.reactions.splice(entryIndex, 1);
        }
      } else {
        // User hasn't reacted with this emoji yet -> add them
        item.reactions[entryIndex].users.push(userId);
      }
    } else {
      // This emoji doesn't exist yet -> create a new reaction entry
      item.reactions = item.reactions || [];
      item.reactions.push({ emoji, users: [userId] });
    }

    const updated = await item.save();
    const populated = await Item.findById(updated._id).populate(
      "postedBy",
      "userName",
    );
    res.status(200).json(populated);
  } catch (error) {
    next(error);
  }
});

// DELETE /items/:itemId - Delete an item (only author or admin)
router.delete("/:itemId", isAuthenticated, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);

    // Authorization check
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
