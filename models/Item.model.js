const { Schema, model } = require("mongoose");

const itemSchema = new Schema(
  {
    imageUrl: {
      type: String,
      required: [true, "Image URL is required."],
      trim: true,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "postedBy is required."],
    },

    taggedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    cohort: {
      type: Schema.Types.ObjectId,
      ref: "Cohort",
      // required: [true, "Cohort is required."],
    },
  },
  { timestamps: true },
);

module.exports = model("Item", itemSchema);
