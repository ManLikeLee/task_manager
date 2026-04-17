const express = require("express");

const taskController = require("../controllers/taskController");
const verifyAccessToken = require("../middlewares/verifyAccessToken");

const router = express.Router();

router.use(verifyAccessToken);

router.post("/tasks", taskController.createTask);
router.get("/tasks/:projectId", taskController.getTasksByProject);
router.patch("/tasks/:id", taskController.updateTask);
router.delete("/tasks/:id", taskController.deleteTask);

module.exports = router;
