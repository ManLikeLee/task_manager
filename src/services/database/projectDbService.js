const prisma = require("../../prisma/client");

const projectWithWorkspaceSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  workspaceId: true,
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
};

const createProject = (data) =>
  prisma.project.create({
    data,
    select: projectWithWorkspaceSelect,
  });

const listProjects = (options = {}) =>
  prisma.project.findMany({
    ...options,
  });

const getProjectById = (id, options = {}) =>
  prisma.project.findUnique({
    where: { id },
    select: projectWithWorkspaceSelect,
    ...options,
  });

const updateProject = (id, data) =>
  prisma.project.update({
    where: { id },
    data,
  });

const deleteProject = (id) =>
  prisma.project.delete({
    where: { id },
  });

module.exports = {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  deleteProject,
  projectWithWorkspaceSelect,
};
