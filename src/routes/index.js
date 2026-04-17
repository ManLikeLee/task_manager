const express = require("express");

const healthController = require("../controllers/healthController");
const taskRoutes = require("./taskRoutes");

const router = express.Router();

router.get("/health", healthController.getHealthStatus);
router.use(taskRoutes);

module.exports = router;
