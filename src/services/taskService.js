const AppError = require("../utils/AppError");
const taskDbService = require("./database/taskDbService");
const projectDbService = require("./database/projectDbService");
const userDbService = require("./database/userDbService");
const workspaceMemberDbService = require("./database/workspaceMemberDbService");

const ensureWorkspaceAccess = async (workspace, userId) => {
  if (workspace.ownerId === userId) {
    return true;
  }

  const membership =
    await workspaceMemberDbService.getWorkspaceMemberByWorkspaceAndUser(
      workspace.id,
      userId,
    );

  if (!membership) {
    throw new AppError("You do not have access to this workspace.", 403);
  }

  return true;
};

const ensureProjectAccess = async (projectId, userId) => {
  const project = await projectDbService.getProjectById(projectId);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  await ensureWorkspaceAccess(project.workspace, userId);

  return project;
};

const ensureTaskAccess = async (taskId, userId) => {
  const task = await taskDbService.getTaskById(taskId);

  if (!task) {
    throw new AppError("Task not found.", 404);
  }

  await ensureWorkspaceAccess(task.project.workspace, userId);

  return task;
};

const ensureAssigneeInWorkspace = async (workspace, assigneeId) => {
  if (!assigneeId) {
    return null;
  }

  const assignee = await userDbService.getUserById(assigneeId);

  if (!assignee) {
    throw new AppError("Assignee not found.", 404);
  }

  if (workspace.ownerId === assigneeId) {
    return assignee;
  }

  const membership =
    await workspaceMemberDbService.getWorkspaceMemberByWorkspaceAndUser(
      workspace.id,
      assigneeId,
    );

  if (!membership) {
    throw new AppError("Assignee must belong to the workspace.", 400);
  }

  return assignee;
};

const createTask = async (payload, userId) => {
  const project = await ensureProjectAccess(payload.projectId, userId);

  await ensureAssigneeInWorkspace(project.workspace, payload.assigneeId);

  return taskDbService.createTask({
    title: payload.title,
    description: payload.description ?? null,
    status: payload.status,
    priority: payload.priority,
    dueDate: payload.dueDate ?? null,
    assigneeId: payload.assigneeId ?? null,
    creatorId: userId,
    projectId: payload.projectId,
  });
};

const getTasksByProject = async (projectId, userId) => {
  await ensureProjectAccess(projectId, userId);

  return taskDbService.listTasksByProject(projectId);
};

const updateTask = async (taskId, payload, userId) => {
  const task = await ensureTaskAccess(taskId, userId);

  if (Object.prototype.hasOwnProperty.call(payload, "assigneeId")) {
    await ensureAssigneeInWorkspace(task.project.workspace, payload.assigneeId);
  }

  return taskDbService.updateTask(taskId, {
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.description !== undefined
      ? { description: payload.description ?? null }
      : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
    ...(payload.dueDate !== undefined ? { dueDate: payload.dueDate ?? null } : {}),
    ...(payload.assigneeId !== undefined
      ? { assigneeId: payload.assigneeId ?? null }
      : {}),
  });
};

const deleteTask = async (taskId, userId) => {
  await ensureTaskAccess(taskId, userId);

  return taskDbService.deleteTask(taskId);
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
};
