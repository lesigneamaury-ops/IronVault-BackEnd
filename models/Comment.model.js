const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Content is required."],
      trim: true,
      maxlength: 500,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required."],
    },
    item: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item is required."],
    },
    reactions: [
      {
        emoji: {
          type: String,
          required: true,
          trim: true,
          maxlength: 16,
        },
        users: [
          {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

module.exports = model("Comment", commentSchema);
