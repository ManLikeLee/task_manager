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
  prisma.workspace.findMany(
    options.select || options.include
      ? {
          ...options,
        }
      : {
          include: {
            owner: true,
            members: true,
            projects: true,
          },
          ...options,
        },
  );

const getWorkspaceById = (id, options = {}) =>
  prisma.workspace.findUnique(
    options.select || options.include
      ? {
          where: { id },
          ...options,
        }
      : {
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
        },
  );

const getWorkspaceByJoinCode = (joinCode, options = {}) =>
  prisma.workspace.findUnique(
    options.select || options.include
      ? {
          where: { joinCode },
          ...options,
        }
      : {
          where: { joinCode },
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
        },
  );

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
  getWorkspaceByJoinCode,
  updateWorkspace,
  deleteWorkspace,
};
