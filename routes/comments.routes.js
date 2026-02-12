const router = require("express").Router();
const Comment = require("../models/Comment.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

// Reusable populate config for comments (author name + reaction user names)
const COMMENT_POPULATE = [
  { path: "author", select: "userName profilePicture" },
  { path: "reactions.users", select: "userName" },
];

// POST /comments/items/:itemId/comments - Create a comment on an item
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
        reactions: [],
      });

      const populated = await Comment.findById(newComment._id).populate(
        COMMENT_POPULATE,
      );

      res.status(201).json(populated);
    } catch (error) {
      next(error);
    }
  },
);

// GET /comments/items/:itemId/comments - Get all comments for an item
router.get(
  "/items/:itemId/comments",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { itemId } = req.params;

      const comments = await Comment.find({ item: itemId })
        .populate(COMMENT_POPULATE)
        .sort({ createdAt: -1 });

      res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /comments/comments/:commentId - Update a comment (author or admin only)
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

      // Authorization check: only the author or an admin can edit
      const isAuthor = String(comment.author) === String(req.payload._id);
      const isAdmin = req.payload.role === "ADMIN";

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ message: "Action not allowed" });
      }

      const updated = await Comment.findByIdAndUpdate(
        commentId,
        { content: req.body.content },
        { new: true, runValidators: true },
      ).populate(COMMENT_POPULATE);

      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /comments/comments/:commentId - Delete a comment (author or admin only)
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

      // Authorization check
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

// PATCH /comments/comments/:commentId/reactions - Toggle emoji reaction on a comment
router.patch(
  "/comments/:commentId/reactions",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { commentId } = req.params;
      const { emoji } = req.body;
      const userId = String(req.payload._id);

      if (!emoji || typeof emoji !== "string") {
        return res.status(400).json({ errorMessage: "Emoji is required" });
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ errorMessage: "Comment not found" });
      }

      // Find if this emoji reaction already exists
      const reactionIndex = comment.reactions.findIndex(
        (r) => r.emoji === emoji,
      );

      if (reactionIndex === -1) {
        // Emoji doesn't exist yet -> create new reaction entry
        comment.reactions.push({ emoji, users: [req.payload._id] });
      } else {
        const users = comment.reactions[reactionIndex].users.map(String);
        const hasReaction = users.includes(userId);

        if (hasReaction) {
          // User already reacted -> remove their reaction
          comment.reactions[reactionIndex].users = comment.reactions[
            reactionIndex
          ].users.filter((id) => String(id) !== userId);
        } else {
          // User hasn't reacted -> add their reaction
          comment.reactions[reactionIndex].users.push(req.payload._id);
        }

        // If no users left on this emoji, remove the entry
        if (comment.reactions[reactionIndex].users.length === 0) {
          comment.reactions.splice(reactionIndex, 1);
        }
      }

      await comment.save();

      const populated = await Comment.findById(comment._id).populate(
        COMMENT_POPULATE,
      );
      res.status(200).json(populated);
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
