// Load environment variables from .env file
require("dotenv").config();

// Connect to MongoDB database
require("./config/db");

const express = require("express");
const app = express();

// Apply middleware (CORS, JSON parser, morgan logger, cookie-parser)
require("./config")(app);

// Mount all API routes under /api
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

// Handle 404 and server errors
require("./config/error-handling")(app);

module.exports = app;
