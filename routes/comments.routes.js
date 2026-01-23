const router = require("express").Router();
const Comment = require("../models/Comment.model");
const Item = require("../models/Item.model");
const UserModel = require("../models/User.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

router.post("/items/:itemId/comments", isAuthenticated, (req, res, next) => {
  const { itemId } = req.params;
  const userId = req.payload._id;
  const { content } = req.body;
  Comment.create({ content, item: itemId, author: userId })
    .then((newComment) => {
      console.log("New Comment", newComment);
      res.status(201).json(newComment);
    })
    .catch(next);
});

router.get("/items/:itemId/comments", isAuthenticated, (req, res, next) => {
  Comment.find({ item: req.params.itemId })
    .populate("author", "userName")
    .sort({ createdAt: -1 })
    .then((comments) => {
      console.log("comments", comments);
      res.status(200).json(comments);
    })
    .catch(next);
});

router.patch(
  "/comments/:commentId",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const comment = await Comment.findById(req.params.commentId);
      const isAuthor = String(comment.author) === String(req.payload._id);
      const isAdmin = req.payload.role === "ADMIN";

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ message: "Action not allowed" });
      }
      await Comment.findByIdAndUpdate(req.params.commentId, req.body, {
        new: true,
        runValidators: true,
      });
      res.status(200).json({ message: "Comment Updated" });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/comments/:commentId",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const comment = await Comment.findById(req.params.commentId);
      const isAuthor = String(comment.user) === String(req.payload._id);
      const isAdmin = req.payload.role === "ADMIN";

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ message: "Action not allowed" });
      }
      await Comment.findByIdAndDelete(req.params.commentId);
      res.status(200).json({ message: "Comment Deleted" });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
