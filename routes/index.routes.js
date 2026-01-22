const router = require("express").Router();

router.get("/", (req, res) => {
  res.json("IronVault API - All good in here");
});

router.use("/auth", require("./auth.routes"));
router.use("/users", require("./users.routes"));
router.use("/cohorts", require("./cohorts.routes"));
router.use("/items", require("./items.routes"));
router.use("/comments", require("./comments.routes"));
router.use("/admin", require("./admin.routes"));

module.exports = router;
