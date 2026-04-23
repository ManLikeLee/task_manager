const prisma = require("../../prisma/client");

const teamMemberSelect = {
  id: true,
  teamId: true,
  userId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const listTeamMembers = (teamId, options = {}) =>
  prisma.teamMember.findMany({
    where: { teamId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: teamMemberSelect,
    ...options,
  });

const createTeamMember = (data) =>
  prisma.teamMember.create({
    data,
    select: teamMemberSelect,
  });

const getTeamMemberById = (id, options = {}) =>
  prisma.teamMember.findUnique({
    where: { id },
    select: teamMemberSelect,
    ...options,
  });

const getTeamMemberByTeamAndUser = (teamId, userId, options = {}) =>
  prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    select: teamMemberSelect,
    ...options,
  });

const deleteTeamMember = (id) =>
  prisma.teamMember.delete({
    where: { id },
  });

module.exports = {
  listTeamMembers,
  createTeamMember,
  getTeamMemberById,
  getTeamMemberByTeamAndUser,
  deleteTeamMember,
  teamMemberSelect,
};

