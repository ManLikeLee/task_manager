const prisma = require("../../prisma/client");

const teamDetailSelect = {
  id: true,
  workspaceId: true,
  createdById: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  workspace: {
    select: {
      id: true,
      name: true,
      slug: true,
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
  _count: {
    select: {
      members: true,
      projects: true,
    },
  },
};

const createTeam = (data) =>
  prisma.team.create({
    data,
    select: teamDetailSelect,
  });

const listTeams = (options = {}) =>
  prisma.team.findMany({
    ...options,
  });

const getTeamById = (id, options = {}) =>
  prisma.team.findUnique({
    where: { id },
    select: teamDetailSelect,
    ...options,
  });

const updateTeam = (id, data) =>
  prisma.team.update({
    where: { id },
    data,
    select: teamDetailSelect,
  });

const deleteTeam = (id) =>
  prisma.team.delete({
    where: { id },
  });

module.exports = {
  createTeam,
  listTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  teamDetailSelect,
};
