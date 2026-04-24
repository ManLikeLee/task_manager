const prisma = require("../../prisma/client");

const workspaceInviteSelect = {
  id: true,
  workspaceId: true,
  code: true,
  createdById: true,
  roleToAssign: true,
  expiresAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
  workspace: {
    select: {
      id: true,
      name: true,
      slug: true,
      joinCode: true,
      ownerId: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  },
};

const createWorkspaceInvite = (data) =>
  prisma.workspaceInvite.create({
    data,
    select: workspaceInviteSelect,
  });

const listWorkspaceInvites = (options = {}) =>
  prisma.workspaceInvite.findMany({
    ...options,
  });

const getWorkspaceInviteByCode = (code, options = {}) =>
  prisma.workspaceInvite.findUnique({
    where: { code },
    select: workspaceInviteSelect,
    ...options,
  });

const updateWorkspaceInvite = (id, data) =>
  prisma.workspaceInvite.update({
    where: { id },
    data,
    select: workspaceInviteSelect,
  });

module.exports = {
  createWorkspaceInvite,
  listWorkspaceInvites,
  getWorkspaceInviteByCode,
  updateWorkspaceInvite,
  workspaceInviteSelect,
};
