const AppError = require("../utils/AppError");
const authorizationPolicy = require("../policies/authorizationPolicy");
const taskDbService = require("./database/taskDbService");
const projectDbService = require("./database/projectDbService");
const userDbService = require("./database/userDbService");
const workspaceMemberDbService = require("./database/workspaceMemberDbService");

const getWorkspaceMembership = async (workspace, userId) => {
  if (workspace.ownerId === userId) {
    return null;
  }

  return workspaceMemberDbService.getWorkspaceMemberByWorkspaceAndUser(
    workspace.id,
    userId,
  );
};

const ensureWorkspaceAccess = async (workspace, userId) => {
  const membership = await getWorkspaceMembership(workspace, userId);

  if (!authorizationPolicy.canAccessWorkspace(userId, workspace, membership)) {
    throw new AppError("You do not have access to this workspace.", 403);
  }

  return {
    membership,
    role: authorizationPolicy.resolveWorkspaceRole(userId, workspace, membership),
  };
};

const ensureWorkspaceTaskManagementAccess = async (workspace, userId) => {
  const membership = await getWorkspaceMembership(workspace, userId);

  if (!authorizationPolicy.canAccessWorkspace(userId, workspace, membership)) {
    throw new AppError("You do not have access to this workspace.", 403);
  }

  if (!authorizationPolicy.canManageTask(userId, workspace, membership)) {
    throw new AppError(
      "Insufficient permissions to manage tasks in this workspace.",
      403,
    );
  }

  return {
    membership,
    role: authorizationPolicy.resolveWorkspaceRole(userId, workspace, membership),
  };
};

const ensureProjectAccess = async (projectId, userId) => {
  const project = await projectDbService.getProjectById(projectId);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  const access = await ensureWorkspaceAccess(project.workspace, userId);

  return {
    project,
    ...access,
  };
};

const ensureProjectTaskManagementAccess = async (projectId, userId) => {
  const project = await projectDbService.getProjectById(projectId);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  const access = await ensureWorkspaceTaskManagementAccess(project.workspace, userId);

  return {
    project,
    ...access,
  };
};

const ensureTaskAccess = async (taskId, userId) => {
  const task = await taskDbService.getTaskById(taskId);

  if (!task) {
    throw new AppError("Task not found.", 404);
  }

  const access = await ensureWorkspaceAccess(task.project.workspace, userId);

  return {
    task,
    ...access,
  };
};

const ensureTaskManagementAccess = async (taskId, userId) => {
  const task = await taskDbService.getTaskById(taskId);

  if (!task) {
    throw new AppError("Task not found.", 404);
  }

  const access = await ensureWorkspaceTaskManagementAccess(task.project.workspace, userId);

  return {
    task,
    ...access,
  };
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

const buildTaskListWhere = (filters) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.assigneeId) {
    where.assigneeId = filters.assigneeId;
  }

  if (filters.dueBefore || filters.dueAfter) {
    where.dueDate = {
      ...(filters.dueBefore ? { lte: filters.dueBefore } : {}),
      ...(filters.dueAfter ? { gte: filters.dueAfter } : {}),
    };
  }

  if (filters.q) {
    where.OR = [
      {
        title: {
          contains: filters.q,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: filters.q,
          mode: "insensitive",
        },
      },
    ];
  }

  return where;
};

const buildTaskListOrderBy = (sortBy, sortOrder) => [
  { [sortBy]: sortOrder },
  { id: sortOrder },
];

const createTask = async (payload, userId) => {
  const { project } = await ensureProjectTaskManagementAccess(
    payload.projectId,
    userId,
  );

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

const getTasksByProject = async (projectId, query, userId) => {
  await ensureProjectAccess(projectId, userId);

  const take = query.limit + 1;
  const items = await taskDbService.listTasksByProject(projectId, {
    where: buildTaskListWhere(query),
    orderBy: buildTaskListOrderBy(query.sortBy, query.sortOrder),
    take,
    ...(query.cursor
      ? {
          cursor: { id: query.cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = items.length > query.limit;
  const tasks = hasMore ? items.slice(0, query.limit) : items;
  const nextCursor = hasMore ? tasks[tasks.length - 1].id : null;

  return {
    tasks,
    nextCursor,
    hasMore,
  };
};

const updateTask = async (taskId, payload, userId) => {
  const { task } = await ensureTaskManagementAccess(taskId, userId);

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
  await ensureTaskManagementAccess(taskId, userId);

  return taskDbService.deleteTask(taskId);
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
};
