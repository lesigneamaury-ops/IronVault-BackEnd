require("dotenv").config();
require("./config/db");

const express = require("express");
const app = express();

require("./config")(app);

const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

require("./config/error-handling")(app);

module.exports = app;
