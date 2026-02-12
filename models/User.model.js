const { Schema, model } = require("mongoose");

// User schema - stores account info, role, profile, and social links
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required."],
    },
    userName: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    cohort: {
      type: Schema.Types.ObjectId,
      ref: "Cohort",
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    profilePicture: {
      type: String,
      default: null,
    },
    socialLinks: {
      linkedin: { type: String, default: null },
      github: { type: String, default: null },
      instagram: { type: String, default: null },
      twitter: { type: String, default: null },
    },
  },
  { timestamps: true },
);

const User = model("User", userSchema);
module.exports = User;
