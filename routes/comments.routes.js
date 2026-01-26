const router = require("express").Router();
const Comment = require("../models/Comment.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

// CREATE comment for an item
router.post(
  "/items/:itemId/comments",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { itemId } = req.params;
      const { content } = req.body;

      const newComment = await Comment.create({
        content,
        item: itemId,
        author: req.payload._id,
      });

      const populated = await Comment.findById(newComment._id).populate(
        "author",
        "userName",
      );

      res.status(201).json(populated);
    } catch (error) {
      next(error);
    }
  },
);

// GET comments for an item
router.get(
  "/items/:itemId/comments",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { itemId } = req.params;

      const comments = await Comment.find({ item: itemId })
        .populate("author", "userName")
        .sort({ createdAt: -1 });

      res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  },
);

// UPDATE comment (author or admin)
router.patch(
  "/comments/:commentId",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { commentId } = req.params;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ errorMessage: "Comment not found" });
      }

      const isAuthor = String(comment.author) === String(req.payload._id);
      const isAdmin = req.payload.role === "ADMIN";

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ message: "Action not allowed" });
      }

      const updated = await Comment.findByIdAndUpdate(
        commentId,
        { content: req.body.content },
        { new: true, runValidators: true },
      ).populate("author", "userName");

      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE comment (author or admin)
router.delete(
  "/comments/:commentId",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { commentId } = req.params;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ errorMessage: "Comment not found" });
      }

      const isAuthor = String(comment.author) === String(req.payload._id);
      const isAdmin = req.payload.role === "ADMIN";

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ message: "Action not allowed" });
      }

      await Comment.findByIdAndDelete(commentId);
      res.status(200).json({ message: "Comment deleted" });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
