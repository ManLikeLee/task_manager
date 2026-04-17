const prisma = require("../../prisma/client");

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

const taskDetailSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  assigneeId: true,
  creatorId: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  assignee: {
    select: safeUserSelect,
  },
  creator: {
    select: safeUserSelect,
  },
  project: {
    select: {
      id: true,
      name: true,
      workspaceId: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
        },
      },
    },
  },
};

const createTask = (data) =>
  prisma.task.create({
    data,
    select: taskDetailSelect,
  });

const listTasks = (options = {}) =>
  prisma.task.findMany({
    select: taskDetailSelect,
    ...options,
  });

const listTasksByProject = (projectId, options = {}) =>
  prisma.task.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: taskDetailSelect,
    ...options,
  });

const getTaskById = (id, options = {}) =>
  prisma.task.findUnique({
    where: { id },
    select: taskDetailSelect,
    ...options,
  });

const updateTask = (id, data) =>
  prisma.task.update({
    where: { id },
    data,
    select: taskDetailSelect,
  });

const deleteTask = (id) =>
  prisma.task.delete({
    where: { id },
  });

module.exports = {
  createTask,
  listTasks,
  listTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  taskDetailSelect,
};
