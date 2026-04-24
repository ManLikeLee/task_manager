const AppError = require("../utils/AppError");
const authorizationPolicy = require("../policies/authorizationPolicy");
const taskDbService = require("./database/taskDbService");
const taskCommentDbService = require("./database/taskCommentDbService");
const projectDbService = require("./database/projectDbService");
const teamDbService = require("./database/teamDbService");
const teamMemberDbService = require("./database/teamMemberDbService");
const workspaceInviteDbService = require("./database/workspaceInviteDbService");
const userDbService = require("./database/userDbService");
const workspaceDbService = require("./database/workspaceDbService");
const workspaceMemberDbService = require("./database/workspaceMemberDbService");

const getWorkspaceMembership = async (workspace, userId) => {
  if (workspace.ownerId === userId) {
    return null;
  }

  return workspaceMemberDbService.getWorkspaceMemberByWorkspaceAndUser(
    workspace.id,
    userId,
  );
};

const ensureWorkspaceAccess = async (workspace, userId) => {
  const membership = await getWorkspaceMembership(workspace, userId);

  if (!authorizationPolicy.canAccessWorkspace(userId, workspace, membership)) {
    throw new AppError("You do not have access to this workspace.", 403);
  }

  return {
    membership,
    role: authorizationPolicy.resolveWorkspaceRole(userId, workspace, membership),
  };
};

const ensureWorkspaceTaskManagementAccess = async (workspace, userId) => {
  const membership = await getWorkspaceMembership(workspace, userId);

  if (!authorizationPolicy.canAccessWorkspace(userId, workspace, membership)) {
    throw new AppError("You do not have access to this workspace.", 403);
  }

  if (!authorizationPolicy.canManageTask(userId, workspace, membership)) {
    throw new AppError(
      "Insufficient permissions to manage tasks in this workspace.",
      403,
    );
  }

  return {
    membership,
    role: authorizationPolicy.resolveWorkspaceRole(userId, workspace, membership),
  };
};

const ensureProjectAccess = async (projectId, userId) => {
  const project = await projectDbService.getProjectById(projectId);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  const access = await ensureWorkspaceAccess(project.workspace, userId);

  return {
    project,
    ...access,
  };
};

const ensureProjectTaskManagementAccess = async (projectId, userId) => {
  const project = await projectDbService.getProjectById(projectId);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  const access = await ensureWorkspaceTaskManagementAccess(project.workspace, userId);

  return {
    project,
    ...access,
  };
};

const ensureTeamAccess = async (teamId, userId) => {
  const team = await teamDbService.getTeamById(teamId, {
    select: {
      id: true,
      workspaceId: true,
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
    },
  });

  if (!team) {
    throw new AppError("Team not found.", 404);
  }

  const access = await ensureWorkspaceAccess(team.workspace, userId);

  return {
    team,
    ...access,
  };
};

const ensureTeamManagementAccess = async (teamId, userId) => {
  const team = await teamDbService.getTeamById(teamId, {
    select: {
      id: true,
      workspaceId: true,
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
    },
  });

  if (!team) {
    throw new AppError("Team not found.", 404);
  }

  const access = await ensureWorkspaceTaskManagementAccess(team.workspace, userId);

  return {
    team,
    ...access,
  };
};

const ensureTaskManagementAccess = async (taskId, userId) => {
  const task = await taskDbService.getTaskById(taskId);

  if (!task) {
    throw new AppError("Task not found.", 404);
  }

  const access = await ensureWorkspaceTaskManagementAccess(task.project.workspace, userId);

  return {
    task,
    ...access,
  };
};

const ensureTaskAccess = async (taskId, userId) => {
  const task = await taskDbService.getTaskById(taskId);

  if (!task) {
    throw new AppError("Task not found.", 404);
  }

  const access = await ensureWorkspaceAccess(task.project.workspace, userId);

  return {
    task,
    ...access,
  };
};

const ensureAssigneeInWorkspace = async (workspace, assigneeId) => {
  if (!assigneeId) {
    return null;
  }

  const assignee = await userDbService.getUserById(assigneeId);

  if (!assignee) {
    throw new AppError("Assignee not found.", 404);
  }

  if (workspace.ownerId === assigneeId) {
    return assignee;
  }

  const membership =
    await workspaceMemberDbService.getWorkspaceMemberByWorkspaceAndUser(
      workspace.id,
      assigneeId,
    );

  if (!membership) {
    throw new AppError("Assignee must belong to the workspace.", 400);
  }

  return assignee;
};

const resolveAssigneePayload = async (workspace, payload = {}) => {
  const hasAssigneeId = Object.prototype.hasOwnProperty.call(payload, "assigneeId");
  const hasAssigneeName = Object.prototype.hasOwnProperty.call(payload, "assigneeName");

  if (!hasAssigneeId && !hasAssigneeName) {
    return {};
  }

  if (hasAssigneeId && payload.assigneeId) {
    const assignee = await ensureAssigneeInWorkspace(workspace, payload.assigneeId);
    return {
      assigneeId: assignee?.id || payload.assigneeId,
      assigneeName: null,
    };
  }

  if (hasAssigneeName) {
    const typedName = payload.assigneeName?.trim();
    if (!typedName) {
      return {
        assigneeId: null,
        assigneeName: null,
      };
    }

    const normalizedUsername = normalizeUsername(typedName.replace(/^@/, ""));
    if (normalizedUsername) {
      const matchedUser = await userDbService.getUserByUsername(normalizedUsername, {
        select: { id: true, name: true },
      });
      if (matchedUser) {
        try {
          await ensureAssigneeInWorkspace(workspace, matchedUser.id);
          return {
            assigneeId: matchedUser.id,
            assigneeName: null,
          };
        } catch {
          // Fall through to manual assignee for non-workspace users.
        }
      }
    }

    return {
      assigneeId: null,
      assigneeName: typedName,
    };
  }

  if (hasAssigneeId && payload.assigneeId === null) {
    return {
      assigneeId: null,
      assigneeName: null,
    };
  }

  return {};
};

const buildTaskListWhere = (filters) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.assigneeId) {
    where.assigneeId = filters.assigneeId;
  }

  if (filters.dueBefore || filters.dueAfter) {
    where.dueDate = {
      ...(filters.dueBefore ? { lte: filters.dueBefore } : {}),
      ...(filters.dueAfter ? { gte: filters.dueAfter } : {}),
    };
  }

  if (filters.q) {
    where.OR = [
      {
        title: {
          contains: filters.q,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: filters.q,
          mode: "insensitive",
        },
      },
    ];
  }

  return where;
};

const buildTaskListOrderBy = (sortBy, sortOrder) => [
  { [sortBy]: sortOrder },
  { id: sortOrder },
];

const userAccessWhere = (userId) => ({
  OR: [
    {
      workspace: {
        ownerId: userId,
      },
    },
    {
      workspace: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  ],
});

const workspaceAccessWhere = (userId) => ({
  OR: [
    {
      ownerId: userId,
    },
    {
      members: {
        some: {
          userId,
        },
      },
    },
  ],
});

const teamAccessWhere = (userId) => ({
  OR: [
    {
      workspace: {
        ownerId: userId,
      },
    },
    {
      workspace: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  ],
});

const normalizeUsername = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const listProjectsForUser = async (userId, workspaceId) => {
  const projects = await projectDbService.listProjects({
    where: {
      ...userAccessWhere(userId),
      ...(workspaceId ? { workspaceId } : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          joinCode: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    workspace: project.workspace,
    team: project.team || null,
    taskCount: project._count.tasks,
  }));
};

const toSlugBase = (value) =>
  String(value || "workspace")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "workspace";

const buildWorkspaceSlug = async (base) => {
  for (let index = 0; index < 5; index += 1) {
    const suffix = Math.random().toString(36).slice(2, 8);
    const candidate = `${toSlugBase(base)}-${suffix}`;

    const existing = await workspaceDbService.listWorkspaces({
      where: { slug: candidate },
      select: { id: true },
      take: 1,
    });

    if (!existing.length) {
      return candidate;
    }
  }

  return `${toSlugBase(base)}-${Date.now()}`;
};

const generateWorkspaceJoinCode = async () => {
  for (let index = 0; index < 12; index += 1) {
    const code = `TF-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const existing = await workspaceDbService.getWorkspaceByJoinCode(code, {
      select: { id: true },
    });
    if (!existing) {
      return code;
    }
  }

  return `TF-${Date.now().toString(36).slice(-5).toUpperCase()}`;
};

const listWorkspacesForUser = async (userId) => {
  const workspaces = await workspaceDbService.listWorkspaces({
    where: workspaceAccessWhere(userId),
    select: {
      id: true,
      name: true,
      slug: true,
      joinCode: true,
      description: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
      _count: {
        select: {
          projects: true,
          members: true,
          teams: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });

  const hydratedWorkspaces = await Promise.all(
    workspaces.map(async (workspace) => {
      let joinCode = workspace.joinCode;

      if (!joinCode) {
        joinCode = await generateWorkspaceJoinCode();
        await workspaceDbService.updateWorkspace(workspace.id, { joinCode });
      }

      const membership =
        workspace.ownerId === userId
          ? null
          : await workspaceMemberDbService.getWorkspaceMemberByWorkspaceAndUser(
              workspace.id,
              userId,
              { select: { role: true } },
            );

      return {
        ...workspace,
        joinCode,
        role:
          workspace.ownerId === userId
            ? "OWNER"
            : membership?.role || "MEMBER",
      };
    }),
  );

  return hydratedWorkspaces;
};

const createWorkspaceForUser = async (payload, userId) => {
  const user = await userDbService.getUserById(userId, {
    select: { id: true, name: true },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const slug = await buildWorkspaceSlug(payload.name);
  const joinCode = await generateWorkspaceJoinCode();

  const workspace = await workspaceDbService.createWorkspace({
    name: payload.name,
    description: payload.description ?? null,
    ownerId: userId,
    slug,
    joinCode,
  });

  const existingMembership =
    await workspaceMemberDbService.getWorkspaceMemberByWorkspaceAndUser(
      workspace.id,
      userId,
      { select: { id: true } },
    );

  if (!existingMembership) {
    await workspaceMemberDbService.createWorkspaceMember({
      workspaceId: workspace.id,
      userId,
      role: "OWNER",
    });
  }

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    joinCode: workspace.joinCode,
    description: workspace.description,
    ownerId: workspace.ownerId,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    role: "OWNER",
  };
};

const generateInviteCode = async () => {
  for (let index = 0; index < 10; index += 1) {
    const code = `TF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const existing = await workspaceInviteDbService.getWorkspaceInviteByCode(code, {
      select: { id: true },
    });
    if (!existing) return code;
  }
  return `TF-${Date.now().toString(36).toUpperCase()}`;
};

const createWorkspaceInvite = async (workspaceId, payload, userId) => {
  const workspace = await workspaceDbService.getWorkspaceById(workspaceId, {
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
    },
  });

  if (!workspace) {
    throw new AppError("Workspace not found.", 404);
  }

  await ensureWorkspaceTaskManagementAccess(workspace, userId);
  const code = await generateInviteCode();

  return workspaceInviteDbService.createWorkspaceInvite({
    workspaceId,
    code,
    createdById: userId,
    roleToAssign: payload.roleToAssign || "MEMBER",
    expiresAt: payload.expiresAt || null,
  });
};

const listWorkspaceInvites = async (workspaceId, userId) => {
  const workspace = await workspaceDbService.getWorkspaceById(workspaceId, {
    select: {
      id: true,
      ownerId: true,
      name: true,
      slug: true,
    },
  });

  if (!workspace) {
    throw new AppError("Workspace not found.", 404);
  }

  await ensureWorkspaceTaskManagementAccess(workspace, userId);

  return workspaceInviteDbService.listWorkspaceInvites({
    where: {
      workspaceId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
};

const joinWorkspaceByCode = async (workspaceCode, userId) => {
  const code = String(workspaceCode || "").trim().toUpperCase();

  const workspace = await workspaceDbService.getWorkspaceByJoinCode(code, {
    select: {
      id: true,
      name: true,
      slug: true,
      joinCode: true,
      ownerId: true,
    },
  });

  if (workspace) {
    if (workspace.ownerId === userId) {
      return {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          joinCode: workspace.joinCode,
        },
        alreadyMember: true,
        role: "OWNER",
      };
    }

    const existingMembership =
      await workspaceMemberDbService.getWorkspaceMemberByWorkspaceAndUser(
        workspace.id,
        userId,
      );

    if (!existingMembership) {
      await workspaceMemberDbService.createWorkspaceMember({
        workspaceId: workspace.id,
        userId,
        role: "MEMBER",
      });
    }

    return {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        joinCode: workspace.joinCode,
      },
      alreadyMember: Boolean(existingMembership),
      role: existingMembership?.role || "MEMBER",
    };
  }

  const invite = await workspaceInviteDbService.getWorkspaceInviteByCode(code);

  if (!invite) {
    throw new AppError("Workspace code is invalid.", 404);
  }

  if (invite.revokedAt) {
    throw new AppError("Workspace invite code has been revoked.", 400);
  }

  if (invite.expiresAt && new Date(invite.expiresAt).valueOf() < Date.now()) {
    throw new AppError("Workspace invite code has expired.", 400);
  }

  if (invite.workspace.ownerId === userId) {
    return {
      workspace: {
        id: invite.workspace.id,
        name: invite.workspace.name,
        slug: invite.workspace.slug,
        joinCode: invite.workspace.joinCode || null,
      },
      alreadyMember: true,
      role: "OWNER",
    };
  }

  const existingMembership =
    await workspaceMemberDbService.getWorkspaceMemberByWorkspaceAndUser(
      invite.workspaceId,
      userId,
    );

  if (!existingMembership) {
    await workspaceMemberDbService.createWorkspaceMember({
      workspaceId: invite.workspaceId,
      userId,
      role: invite.roleToAssign || "MEMBER",
    });
  }

  return {
    workspace: {
      id: invite.workspace.id,
      name: invite.workspace.name,
      slug: invite.workspace.slug,
      joinCode: invite.workspace.joinCode || null,
    },
    alreadyMember: Boolean(existingMembership),
    role: existingMembership?.role || invite.roleToAssign || "MEMBER",
  };
};

const createProjectForUser = async (payload, userId) => {
  let workspace = null;

  if (payload.workspaceId) {
    workspace = await workspaceDbService.getWorkspaceById(payload.workspaceId, {
      select: {
        id: true,
        name: true,
        slug: true,
        ownerId: true,
      },
    });
  } else {
    const accessible = await listWorkspacesForUser(userId);
    workspace = accessible[0] || null;
  }

  if (!workspace) {
    throw new AppError("Create or join a workspace before creating projects.", 400);
  }

  await ensureWorkspaceTaskManagementAccess(workspace, userId);

  if (payload.teamId) {
    const team = await teamDbService.getTeamById(payload.teamId, {
      select: {
        id: true,
        workspaceId: true,
      },
    });

    if (!team || team.workspaceId !== workspace.id) {
      throw new AppError("Selected team must belong to the chosen workspace.", 400);
    }
  }

  const project = await projectDbService.createProject({
    workspaceId: workspace.id,
    teamId: payload.teamId || null,
    name: payload.name,
    description: payload.description ?? null,
    status: "ACTIVE",
  });

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    taskCount: 0,
    workspace: project.workspace,
  };
};

const inferActivityAction = (task) => {
  if (task.status === "DONE") {
    return "completed";
  }

  const createdAt = new Date(task.createdAt).valueOf();
  const updatedAt = new Date(task.updatedAt).valueOf();

  if (Math.abs(updatedAt - createdAt) <= 60000) {
    return "created";
  }

  return "moved";
};

const getDashboardOverview = async (userId) => {
  const [projects, tasks] = await Promise.all([
    projectDbService.listProjects({
      where: userAccessWhere(userId),
      select: {
        id: true,
      },
    }),
    taskDbService.listTasks({
      where: {
        project: userAccessWhere(userId),
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const inProgressCount = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const dueTodayCount = tasks.filter((task) => {
    if (!task.dueDate) return false;

    const dueTime = new Date(task.dueDate).valueOf();
    return dueTime >= startOfToday.valueOf() && dueTime <= endOfToday.valueOf();
  }).length;

  const recentActivity = tasks.slice(0, 10).map((task) => ({
    id: task.id,
    taskTitle: task.title,
    projectName: task.project?.name || "Unknown project",
    action: inferActivityAction(task),
    timestamp: task.updatedAt,
  }));

  return {
    stats: {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      inProgress: inProgressCount,
      dueToday: dueTodayCount,
    },
    recentActivity,
  };
};

const createTask = async (payload, userId) => {
  const { project } = await ensureProjectTaskManagementAccess(
    payload.projectId,
    userId,
  );
  const assigneePayload = await resolveAssigneePayload(project.workspace, payload);

  return taskDbService.createTask({
    title: payload.title,
    description: payload.description ?? null,
    status: payload.status,
    priority: payload.priority,
    dueDate: payload.dueDate ?? null,
    assigneeId: assigneePayload.assigneeId ?? null,
    assigneeName: assigneePayload.assigneeName ?? null,
    creatorId: userId,
    projectId: payload.projectId,
  });
};

const getTasksByProject = async (projectId, query, userId) => {
  await ensureProjectAccess(projectId, userId);

  const take = query.limit + 1;
  const items = await taskDbService.listTasksByProject(projectId, {
    where: buildTaskListWhere(query),
    orderBy: buildTaskListOrderBy(query.sortBy, query.sortOrder),
    take,
    ...(query.cursor
      ? {
          cursor: { id: query.cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = items.length > query.limit;
  const tasks = hasMore ? items.slice(0, query.limit) : items;
  const nextCursor = hasMore ? tasks[tasks.length - 1].id : null;

  return {
    tasks,
    nextCursor,
    hasMore,
  };
};

const listProjectAssignees = async (projectId, userId) => {
  const { project } = await ensureProjectAccess(projectId, userId);

  const [owner, workspaceMembers, teamMembers] = await Promise.all([
    userDbService.getUserById(project.workspace.ownerId, {
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
      },
    }),
    workspaceMemberDbService.listWorkspaceMembers({
      where: {
        workspaceId: project.workspace.id,
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: [{ user: { name: "asc" } }],
    }),
    project.teamId
      ? teamMemberDbService.listTeamMembers(project.teamId, {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const prioritized = [];
  const seen = new Set();
  const pushUnique = (user) => {
    if (!user?.id || seen.has(user.id)) return;
    seen.add(user.id);
    prioritized.push(user);
  };

  if (project.teamId) {
    teamMembers.forEach((member) => pushUnique(member.user));
    pushUnique(owner);
  } else {
    pushUnique(owner);
    workspaceMembers.forEach((member) => pushUnique(member.user));
  }

  return prioritized;
};

const updateTask = async (taskId, payload, userId) => {
  const { task } = await ensureTaskManagementAccess(taskId, userId);
  const assigneePayload = await resolveAssigneePayload(task.project.workspace, payload);

  return taskDbService.updateTask(taskId, {
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.description !== undefined
      ? { description: payload.description ?? null }
      : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
    ...(payload.dueDate !== undefined ? { dueDate: payload.dueDate ?? null } : {}),
    ...(Object.keys(assigneePayload).length ? assigneePayload : {}),
  });
};

const deleteTask = async (taskId, userId) => {
  await ensureTaskManagementAccess(taskId, userId);

  return taskDbService.deleteTask(taskId);
};

const listTaskComments = async (taskId, userId) => {
  await ensureTaskAccess(taskId, userId);
  return taskCommentDbService.listCommentsByTask(taskId);
};

const createTaskComment = async (taskId, payload, userId) => {
  await ensureTaskAccess(taskId, userId);
  return taskCommentDbService.createComment({
    taskId,
    authorId: userId,
    body: payload.body,
  });
};

const listTeamsByWorkspace = async (workspaceId, userId) => {
  const workspace = await workspaceDbService.getWorkspaceById(workspaceId, {
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
    },
  });

  if (!workspace) {
    throw new AppError("Workspace not found.", 404);
  }

  await ensureWorkspaceAccess(workspace, userId);

  return teamDbService.listTeams({
    where: { workspaceId },
    select: teamDbService.teamDetailSelect,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
};

const listTeamsForUser = async (userId, workspaceId) => {
  return teamDbService.listTeams({
    where: {
      ...teamAccessWhere(userId),
      ...(workspaceId ? { workspaceId } : {}),
    },
    select: teamDbService.teamDetailSelect,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
};

const createTeamInWorkspace = async (workspaceId, payload, userId) => {
  const workspace = await workspaceDbService.getWorkspaceById(workspaceId, {
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
    },
  });

  if (!workspace) {
    throw new AppError("Workspace not found.", 404);
  }

  await ensureWorkspaceTaskManagementAccess(workspace, userId);

  const created = await teamDbService.createTeam({
    workspaceId,
    createdById: userId,
    name: payload.name,
    description: payload.description ?? null,
  });

  const existingUserMember = await teamMemberDbService.getTeamMemberByTeamAndUser(
    created.id,
    userId,
    {
      select: { id: true },
    },
  );

  if (!existingUserMember) {
    await teamMemberDbService.createTeamMember({
      teamId: created.id,
      userId,
      role: "LEAD",
    });
  }

  return teamDbService.getTeamById(created.id);
};

const listWorkspaceMembersForWorkspace = async (workspaceId, userId) => {
  const workspace = await workspaceDbService.getWorkspaceById(workspaceId, {
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
    },
  });

  if (!workspace) {
    throw new AppError("Workspace not found.", 404);
  }

  await ensureWorkspaceAccess(workspace, userId);

  const [owner, members] = await Promise.all([
    userDbService.getUserById(workspace.ownerId, {
      select: { id: true, name: true, username: true, email: true },
    }),
    workspaceMemberDbService.listWorkspaceMembers({
      where: { workspaceId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: [{ user: { name: "asc" } }],
    }),
  ]);

  const map = new Map();
  if (owner) map.set(owner.id, owner);
  members.forEach((member) => {
    if (member.user) map.set(member.user.id, member.user);
  });
  return Array.from(map.values());
};

const updateTeam = async (teamId, payload, userId) => {
  await ensureTeamManagementAccess(teamId, userId);
  return teamDbService.updateTeam(teamId, payload);
};

const listTeamMembers = async (teamId, userId) => {
  await ensureTeamAccess(teamId, userId);
  return teamMemberDbService.listTeamMembers(teamId);
};

const addTeamMember = async (teamId, payload, userId) => {
  const { team } = await ensureTeamManagementAccess(teamId, userId);
  const username = normalizeUsername(payload.username);
  const user = await userDbService.getUserByUsername(username, {
    select: {
      id: true,
      username: true,
      name: true,
    },
  });

  if (!user) {
    throw new AppError("User with that username was not found.", 404);
  }

  if (user.id === team.workspace.ownerId) {
    throw new AppError("Workspace owner is implicitly part of all teams.", 400);
  }

  const workspaceMembership =
    await workspaceMemberDbService.getWorkspaceMemberByWorkspaceAndUser(
      team.workspace.id,
      user.id,
    );

  if (!workspaceMembership) {
    throw new AppError(
      "User must join the workspace before they can be added to this team.",
      400,
    );
  }

  const existing = await teamMemberDbService.getTeamMemberByTeamAndUser(
    teamId,
    user.id,
    {
      select: { id: true },
    },
  );

  if (existing) {
    throw new AppError("User is already in this team.", 409);
  }

  return teamMemberDbService.createTeamMember({
    teamId,
    userId: user.id,
    role: payload.role || "MEMBER",
  });
};

const removeTeamMember = async (teamId, memberUserId, userId) => {
  await ensureTeamManagementAccess(teamId, userId);
  const member = await teamMemberDbService.getTeamMemberByTeamAndUser(
    teamId,
    memberUserId,
  );

  if (!member || member.teamId !== teamId) {
    throw new AppError("Team member not found.", 404);
  }

  return teamMemberDbService.deleteTeamMember(member.id);
};

const linkProjectToTeam = async (projectId, teamId, userId) => {
  const { project } = await ensureProjectTaskManagementAccess(projectId, userId);

  if (teamId) {
    const { team } = await ensureTeamAccess(teamId, userId);
    if (team.workspace.id !== project.workspace.id) {
      throw new AppError("Project and team must belong to the same workspace.", 400);
    }
  }

  return projectDbService.updateProject(projectId, { teamId: teamId || null });
};

module.exports = {
  listProjectsForUser,
  listWorkspacesForUser,
  createWorkspaceForUser,
  createWorkspaceInvite,
  listWorkspaceInvites,
  joinWorkspaceByCode,
  createProjectForUser,
  getDashboardOverview,
  createTask,
  getTasksByProject,
  listProjectAssignees,
  updateTask,
  deleteTask,
  listTaskComments,
  createTaskComment,
  listTeamsByWorkspace,
  listTeamsForUser,
  createTeamInWorkspace,
  listWorkspaceMembersForWorkspace,
  updateTeam,
  listTeamMembers,
  addTeamMember,
  removeTeamMember,
  linkProjectToTeam,
};
