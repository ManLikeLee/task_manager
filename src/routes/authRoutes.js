const express = require("express");

const authController = require("../controllers/authController");
const { authRateLimiter } = require("../middlewares/rateLimiter");
const verifyAccessToken = require("../middlewares/verifyAccessToken");

const router = express.Router();

router.use(authRateLimiter);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshAccessToken);
router.post("/logout", authController.logout);
router.get("/me", verifyAccessToken, authController.getCurrentUser);

module.exports = router;
