const prisma = require("../../prisma/client");

const workspaceMemberSelect = {
  id: true,
  role: true,
  workspaceId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
};

const createWorkspaceMember = (data) =>
  prisma.workspaceMember.create({
    data,
    include: {
      user: true,
      workspace: true,
    },
  });

const listWorkspaceMembers = (options = {}) =>
  prisma.workspaceMember.findMany({
    include: {
      user: true,
      workspace: true,
    },
    ...options,
  });

const getWorkspaceMemberById = (id, options = {}) =>
  prisma.workspaceMember.findUnique({
    where: { id },
    include: {
      user: true,
      workspace: true,
    },
    ...options,
  });

const getWorkspaceMemberByWorkspaceAndUser = (
  workspaceId,
  userId,
  options = {},
) =>
  prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
    },
    select: workspaceMemberSelect,
    ...options,
  });

const updateWorkspaceMember = (id, data) =>
  prisma.workspaceMember.update({
    where: { id },
    data,
  });

const deleteWorkspaceMember = (id) =>
  prisma.workspaceMember.delete({
    where: { id },
  });

module.exports = {
  createWorkspaceMember,
  listWorkspaceMembers,
  getWorkspaceMemberById,
  getWorkspaceMemberByWorkspaceAndUser,
  updateWorkspaceMember,
  deleteWorkspaceMember,
};
