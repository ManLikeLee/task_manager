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

router.get("/dashboard/overview", taskController.getDashboardOverview);
router.get("/workspaces", taskController.listWorkspaces);
router.post("/workspaces", taskController.createWorkspace);
router.post("/workspaces/join", taskController.joinWorkspace);
router.post("/workspaces/:workspaceId/invites", taskController.createInviteForWorkspace);
router.get("/workspaces/:workspaceId/invites", taskController.listInvitesForWorkspace);
router.get("/projects", taskController.listProjects);
router.post("/projects", taskController.createProject);
router.patch("/projects/:projectId/team", taskController.linkProjectTeam);
router.post("/tasks", taskController.createTask);
router.get("/projects/:projectId/tasks", taskController.getTasksByProject);
router.get("/projects/:projectId/assignees", taskController.listProjectAssignees);
router.get("/teams", taskController.listTeams);
router.get("/workspaces/:workspaceId/teams", taskController.listWorkspaceTeams);
router.get("/workspaces/:workspaceId/members", taskController.listWorkspaceMembers);
router.post("/workspaces/:workspaceId/teams", taskController.createTeam);
router.patch("/teams/:teamId", taskController.updateTeam);
router.get("/teams/:teamId/members", taskController.listMembersForTeam);
router.post("/teams/:teamId/members", taskController.addMemberToTeam);
router.delete("/teams/:teamId/members/:userId", taskController.removeMemberFromTeam);
// Backward-compatible route. Remove once clients are migrated.
router.get(
  "/tasks/:projectId",
  addDeprecatedTaskListWarning,
  taskController.getTasksByProject,
);
router.patch("/tasks/:id", taskController.updateTask);
router.delete("/tasks/:id", taskController.deleteTask);
router.get("/tasks/:id/comments", taskController.listTaskComments);
router.post("/tasks/:id/comments", taskController.createTaskComment);

module.exports = router;
