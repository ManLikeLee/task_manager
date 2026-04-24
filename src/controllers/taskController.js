const asyncHandler = require("../utils/asyncHandler");
const validate = require("../utils/validate");
const { sendSuccess } = require("../utils/response");
const {
  createTaskSchema,
  updateTaskSchema,
  taskProjectParamsSchema,
  taskIdParamsSchema,
  taskListQuerySchema,
  createTaskCommentSchema,
} = require("../validators/taskValidator");
const {
  createProjectSchema,
  listProjectsQuerySchema,
} = require("../validators/projectValidator");
const {
  workspaceIdParamsSchema,
  teamIdParamsSchema,
  teamMemberIdParamsSchema,
  projectIdParamsSchema,
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
  linkProjectTeamSchema,
  listTeamsQuerySchema,
} = require("../validators/teamValidator");
const {
  workspaceIdParamsSchema: workspaceIdForInviteParamsSchema,
  createWorkspaceSchema,
  createWorkspaceInviteSchema,
  joinWorkspaceSchema,
} = require("../validators/workspaceValidator");
const taskService = require("../services/taskService");

const listWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await taskService.listWorkspacesForUser(req.user.sub);

  sendSuccess(res, {
    message: "Workspaces fetched successfully.",
    data: {
      workspaces,
    },
  });
});

const createWorkspace = asyncHandler(async (req, res) => {
  const payload = validate(createWorkspaceSchema, req.body);
  const workspace = await taskService.createWorkspaceForUser(payload, req.user.sub);

  sendSuccess(res, {
    statusCode: 201,
    message: "Workspace created successfully.",
    data: {
      workspace,
    },
  });
});

const createInviteForWorkspace = asyncHandler(async (req, res) => {
  const { workspaceId } = validate(workspaceIdForInviteParamsSchema, req.params);
  const payload = validate(createWorkspaceInviteSchema, req.body);
  const invite = await taskService.createWorkspaceInvite(
    workspaceId,
    {
      roleToAssign: payload.roleToAssign || "MEMBER",
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
    },
    req.user.sub,
  );

  sendSuccess(res, {
    statusCode: 201,
    message: "Workspace invite created successfully.",
    data: {
      invite,
    },
  });
});

const listInvitesForWorkspace = asyncHandler(async (req, res) => {
  const { workspaceId } = validate(workspaceIdForInviteParamsSchema, req.params);
  const invites = await taskService.listWorkspaceInvites(workspaceId, req.user.sub);

  sendSuccess(res, {
    message: "Workspace invites fetched successfully.",
    data: {
      invites,
    },
  });
});

const joinWorkspace = asyncHandler(async (req, res) => {
  const payload = validate(joinWorkspaceSchema, req.body);
  const data = await taskService.joinWorkspaceByCode(
    payload.code,
    req.user.sub,
  );

  sendSuccess(res, {
    message: "Workspace joined successfully.",
    data,
  });
});

const getDashboardOverview = asyncHandler(async (req, res) => {
  const overview = await taskService.getDashboardOverview(req.user.sub);

  sendSuccess(res, {
    message: "Dashboard overview fetched successfully.",
    data: overview,
  });
});

const listProjects = asyncHandler(async (req, res) => {
  const query = validate(listProjectsQuerySchema, req.query);
  const projects = await taskService.listProjectsForUser(
    req.user.sub,
    query.workspaceId,
  );

  sendSuccess(res, {
    message: "Projects fetched successfully.",
    data: {
      projects,
    },
  });
});

const createProject = asyncHandler(async (req, res) => {
  const payload = validate(createProjectSchema, req.body);
  const project = await taskService.createProjectForUser(payload, req.user.sub);

  sendSuccess(res, {
    statusCode: 201,
    message: "Project created successfully.",
    data: {
      project,
    },
  });
});

const createTask = asyncHandler(async (req, res) => {
  const payload = validate(createTaskSchema, req.body);
  const task = await taskService.createTask(payload, req.user.sub);

  sendSuccess(res, {
    statusCode: 201,
    message: "Task created successfully.",
    data: {
      task,
    },
  });
});

const getTasksByProject = asyncHandler(async (req, res) => {
  const { projectId } = validate(taskProjectParamsSchema, req.params);
  const query = validate(taskListQuerySchema, req.query);
  const { tasks, nextCursor, hasMore } = await taskService.getTasksByProject(
    projectId,
    query,
    req.user.sub,
  );

  sendSuccess(res, {
    message: "Tasks fetched successfully.",
    data: {
      tasks,
      nextCursor,
      hasMore,
    },
  });
});

const listProjectAssignees = asyncHandler(async (req, res) => {
  const { projectId } = validate(taskProjectParamsSchema, req.params);
  const assignees = await taskService.listProjectAssignees(projectId, req.user.sub);

  sendSuccess(res, {
    message: "Project assignees fetched successfully.",
    data: {
      assignees,
    },
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const { id } = validate(taskIdParamsSchema, req.params);
  const payload = validate(updateTaskSchema, req.body);
  const task = await taskService.updateTask(id, payload, req.user.sub);

  sendSuccess(res, {
    message: "Task updated successfully.",
    data: {
      task,
    },
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = validate(taskIdParamsSchema, req.params);
  await taskService.deleteTask(id, req.user.sub);

  sendSuccess(res, {
    message: "Task deleted successfully.",
  });
});

const listTaskComments = asyncHandler(async (req, res) => {
  const { id } = validate(taskIdParamsSchema, req.params);
  const comments = await taskService.listTaskComments(id, req.user.sub);

  sendSuccess(res, {
    message: "Task comments fetched successfully.",
    data: {
      comments,
    },
  });
});

const createTaskComment = asyncHandler(async (req, res) => {
  const { id } = validate(taskIdParamsSchema, req.params);
  const payload = validate(createTaskCommentSchema, req.body);
  const comment = await taskService.createTaskComment(id, payload, req.user.sub);

  sendSuccess(res, {
    statusCode: 201,
    message: "Comment posted successfully.",
    data: {
      comment,
    },
  });
});

const listTeams = asyncHandler(async (req, res) => {
  const query = validate(listTeamsQuerySchema, req.query);
  const teams = await taskService.listTeamsForUser(
    req.user.sub,
    query.workspaceId,
  );

  sendSuccess(res, {
    message: "Teams fetched successfully.",
    data: {
      teams,
    },
  });
});

const listWorkspaceTeams = asyncHandler(async (req, res) => {
  const { workspaceId } = validate(workspaceIdParamsSchema, req.params);
  const teams = await taskService.listTeamsByWorkspace(workspaceId, req.user.sub);

  sendSuccess(res, {
    message: "Workspace teams fetched successfully.",
    data: {
      teams,
    },
  });
});

const createTeam = asyncHandler(async (req, res) => {
  const { workspaceId } = validate(workspaceIdParamsSchema, req.params);
  const payload = validate(createTeamSchema, req.body);
  const team = await taskService.createTeamInWorkspace(
    workspaceId,
    payload,
    req.user.sub,
  );

  sendSuccess(res, {
    statusCode: 201,
    message: "Team created successfully.",
    data: {
      team,
    },
  });
});

const listWorkspaceMembers = asyncHandler(async (req, res) => {
  const { workspaceId } = validate(workspaceIdParamsSchema, req.params);
  const members = await taskService.listWorkspaceMembersForWorkspace(
    workspaceId,
    req.user.sub,
  );

  sendSuccess(res, {
    message: "Workspace members fetched successfully.",
    data: {
      members,
    },
  });
});

const updateTeam = asyncHandler(async (req, res) => {
  const { teamId } = validate(teamIdParamsSchema, req.params);
  const payload = validate(updateTeamSchema, req.body);
  const team = await taskService.updateTeam(teamId, payload, req.user.sub);

  sendSuccess(res, {
    message: "Team updated successfully.",
    data: {
      team,
    },
  });
});

const listMembersForTeam = asyncHandler(async (req, res) => {
  const { teamId } = validate(teamIdParamsSchema, req.params);
  const members = await taskService.listTeamMembers(teamId, req.user.sub);

  sendSuccess(res, {
    message: "Team members fetched successfully.",
    data: {
      members,
    },
  });
});

const addMemberToTeam = asyncHandler(async (req, res) => {
  const { teamId } = validate(teamIdParamsSchema, req.params);
  const payload = validate(addTeamMemberSchema, req.body);
  const member = await taskService.addTeamMember(teamId, payload, req.user.sub);

  sendSuccess(res, {
    statusCode: 201,
    message: "Team member added successfully.",
    data: {
      member,
    },
  });
});

const removeMemberFromTeam = asyncHandler(async (req, res) => {
  const { teamId } = validate(teamIdParamsSchema, req.params);
  const { userId } = validate(teamMemberIdParamsSchema, req.params);
  await taskService.removeTeamMember(teamId, userId, req.user.sub);

  sendSuccess(res, {
    message: "Team member removed successfully.",
  });
});

const linkProjectTeam = asyncHandler(async (req, res) => {
  const { projectId } = validate(projectIdParamsSchema, req.params);
  const payload = validate(linkProjectTeamSchema, req.body);
  const project = await taskService.linkProjectToTeam(
    projectId,
    payload.teamId,
    req.user.sub,
  );

  sendSuccess(res, {
    message: "Project team updated successfully.",
    data: {
      project,
    },
  });
});

module.exports = {
  listWorkspaces,
  createWorkspace,
  createInviteForWorkspace,
  listInvitesForWorkspace,
  joinWorkspace,
  getDashboardOverview,
  listProjects,
  createProject,
  createTask,
  getTasksByProject,
  listProjectAssignees,
  updateTask,
  deleteTask,
  listTaskComments,
  createTaskComment,
  listTeams,
  listWorkspaceTeams,
  listWorkspaceMembers,
  createTeam,
  updateTeam,
  listMembersForTeam,
  addMemberToTeam,
  removeMemberFromTeam,
  linkProjectTeam,
};
