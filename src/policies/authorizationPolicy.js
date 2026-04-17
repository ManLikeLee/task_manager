const MANAGE_TASK_ROLES = new Set(["OWNER", "ADMIN"]);

const resolveWorkspaceRole = (userId, workspace, membership) => {
  if (workspace.ownerId === userId) {
    return "OWNER";
  }

  return membership?.role || null;
};

const canAccessWorkspace = (userId, workspace, membership) =>
  Boolean(resolveWorkspaceRole(userId, workspace, membership));

const canManageTask = (userId, workspace, membership) =>
  MANAGE_TASK_ROLES.has(resolveWorkspaceRole(userId, workspace, membership));

module.exports = {
  canAccessWorkspace,
  canManageTask,
  resolveWorkspaceRole,
};
