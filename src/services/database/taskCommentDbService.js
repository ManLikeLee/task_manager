const prisma = require("../../prisma/client");

const taskCommentSelect = {
  id: true,
  taskId: true,
  authorId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  },
};

const listCommentsByTask = (taskId, options = {}) =>
  prisma.taskComment.findMany({
    where: { taskId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: taskCommentSelect,
    ...options,
  });

const createComment = (data) =>
  prisma.taskComment.create({
    data,
    select: taskCommentSelect,
  });

module.exports = {
  listCommentsByTask,
  createComment,
  taskCommentSelect,
};
