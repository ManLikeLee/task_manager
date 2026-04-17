const crypto = require("crypto");
const bcrypt = require("bcrypt");

const prisma = require("../../src/prisma/client");

const randomSuffix = () => crypto.randomUUID().split("-")[0];

const createUser = async (overrides = {}) => {
  const suffix = randomSuffix();
  const password = overrides.password || "Password123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: overrides.name || `Test User ${suffix}`,
      email: overrides.email || `user-${suffix}@example.com`,
      passwordHash,
      refreshTokenHash: overrides.refreshTokenHash || null,
    },
  });

  return {
    ...user,
    password,
  };
};

const createWorkspace = async (overrides = {}) => {
  const owner = overrides.owner || (await createUser());
  const suffix = randomSuffix();

  return prisma.workspace.create({
    data: {
      name: overrides.name || `Workspace ${suffix}`,
      slug: overrides.slug || `workspace-${suffix}`,
      description: overrides.description || null,
      ownerId: overrides.ownerId || owner.id,
    },
  });
};

const createWorkspaceMember = async (overrides = {}) => {
  const workspace = overrides.workspace || (await createWorkspace());
  const user = overrides.user || (await createUser());

  return prisma.workspaceMember.create({
    data: {
      workspaceId: overrides.workspaceId || workspace.id,
      userId: overrides.userId || user.id,
      role: overrides.role || "MEMBER",
    },
  });
};

const createProject = async (overrides = {}) => {
  const workspace = overrides.workspace || (await createWorkspace());
  const suffix = randomSuffix();

  return prisma.project.create({
    data: {
      workspaceId: overrides.workspaceId || workspace.id,
      name: overrides.name || `Project ${suffix}`,
      description: overrides.description || null,
      status: overrides.status || "PLANNING",
    },
  });
};

const createTask = async (overrides = {}) => {
  const project = overrides.project || (await createProject());
  const creator = overrides.creator || (await createUser());
  const suffix = randomSuffix();

  return prisma.task.create({
    data: {
      projectId: overrides.projectId || project.id,
      title: overrides.title || `Task ${suffix}`,
      description: overrides.description || null,
      status: overrides.status || "TODO",
      priority: overrides.priority || "MEDIUM",
      dueDate: overrides.dueDate || null,
      assigneeId: overrides.assigneeId || null,
      creatorId: overrides.creatorId || creator.id,
    },
  });
};

module.exports = {
  createProject,
  createTask,
  createUser,
  createWorkspace,
  createWorkspaceMember,
};
