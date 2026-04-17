const prisma = require("../../prisma/client");

const createWorkspace = (data) =>
  prisma.workspace.create({
    data,
    include: {
      owner: true,
      members: true,
    },
  });

const listWorkspaces = (options = {}) =>
  prisma.workspace.findMany({
    include: {
      owner: true,
      members: true,
      projects: true,
    },
    ...options,
  });

const getWorkspaceById = (id, options = {}) =>
  prisma.workspace.findUnique({
    where: { id },
    include: {
      owner: true,
      members: {
        include: {
          user: true,
        },
      },
      projects: true,
    },
    ...options,
  });

const updateWorkspace = (id, data) =>
  prisma.workspace.update({
    where: { id },
    data,
  });

const deleteWorkspace = (id) =>
  prisma.workspace.delete({
    where: { id },
  });

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
};
