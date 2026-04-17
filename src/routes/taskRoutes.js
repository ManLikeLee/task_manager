const express = require("express");

const taskController = require("../controllers/taskController");
const verifyAccessToken = require("../middlewares/verifyAccessToken");

const router = express.Router();

router.use(verifyAccessToken);

const addDeprecatedTaskListWarning = (_req, res, next) => {
  res.set(
    "Warning",
    '299 - "Deprecated endpoint, use /api/projects/:projectId/tasks"',
  );
  next();
};

router.get("/projects", taskController.listProjects);
router.post("/tasks", taskController.createTask);
router.get("/projects/:projectId/tasks", taskController.getTasksByProject);
// Backward-compatible route. Remove once clients are migrated.
router.get(
  "/tasks/:projectId",
  addDeprecatedTaskListWarning,
  taskController.getTasksByProject,
);
router.patch("/tasks/:id", taskController.updateTask);
router.delete("/tasks/:id", taskController.deleteTask);

module.exports = router;
