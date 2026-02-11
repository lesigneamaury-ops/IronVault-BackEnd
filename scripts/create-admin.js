#!/usr/bin/env node
require("../config/db");

const User = require("../models/User.model");
const bcrypt = require("bcryptjs");

const email = "admin@a.com";
const userName = "Admin";
const password = "admin1234";

async function run() {
  try {
    const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(12));

    const existing = await User.findOne({ email });
    if (existing) {
      existing.userName = userName;
      existing.passwordHash = hashedPassword;
      existing.role = "ADMIN";
      await existing.save();
      console.log(`Admin user updated: ${email}`);
    } else {
      await User.create({
        email,
        userName,
        passwordHash: hashedPassword,
        role: "ADMIN",
      });
      console.log(`Admin user created: ${email}`);
    }

    console.log(
      "Done. You can now login at /auth/login with the admin credentials.",
    );
    process.exit(0);
  } catch (err) {
    console.error("Failed to create/update admin user:", err);
    process.exit(1);
  }
}

run();
