const request = require("supertest");

const app = require("../../src/app");
const { generateAccessToken } = require("../../src/utils/token");
const {
  createProject,
  createTask,
  createUser,
  createWorkspace,
  createWorkspaceMember,
} = require("../helpers/factories");

const createAuthorizedProjectContext = async () => {
  const owner = await createUser();
  const assignee = await createUser();
  const workspace = await createWorkspace({ owner });
  const project = await createProject({ workspace });

  await createWorkspaceMember({
    workspace,
    user: assignee,
    role: "MEMBER",
  });

  const accessToken = generateAccessToken({
    sub: owner.id,
    email: owner.email,
  });

  return {
    owner,
    assignee,
    workspace,
    project,
    accessToken,
  };
};

describe("task listing routes", () => {
  test("supports both new and deprecated listing routes", async () => {
    const { project, owner, accessToken } = await createAuthorizedProjectContext();

    await createTask({ project, creator: owner, title: "Task A" });
    await createTask({ project, creator: owner, title: "Task B" });

    const newRouteResponse = await request(app)
      .get(`/api/projects/${project.id}/tasks`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(newRouteResponse.status).toBe(200);
    expect(newRouteResponse.headers.warning).toBeUndefined();
    expect(newRouteResponse.body.success).toBe(true);
    expect(newRouteResponse.body.data).toEqual(
      expect.objectContaining({
        tasks: expect.any(Array),
        nextCursor: null,
        hasMore: false,
      }),
    );

    const deprecatedRouteResponse = await request(app)
      .get(`/api/tasks/${project.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deprecatedRouteResponse.status).toBe(200);
    expect(deprecatedRouteResponse.headers.warning).toBe(
      '299 - "Deprecated endpoint, use /api/projects/:projectId/tasks"',
    );

    const newRouteTaskIds = newRouteResponse.body.data.tasks.map((task) => task.id);
    const deprecatedRouteTaskIds = deprecatedRouteResponse.body.data.tasks.map(
      (task) => task.id,
    );

    expect(deprecatedRouteTaskIds).toEqual(newRouteTaskIds);
  });

  test("applies filtering params on project task listing", async () => {
    const { project, owner, assignee, workspace, accessToken } =
      await createAuthorizedProjectContext();

    const otherProject = await createProject({ workspace });

    await createTask({
      project,
      creator: owner,
      assigneeId: assignee.id,
      title: "Alpha backend",
      description: "API cleanup",
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date("2026-05-10T00:00:00.000Z"),
    });

    await createTask({
      project,
      creator: owner,
      assigneeId: assignee.id,
      title: "Gamma docs",
      description: "No keyword",
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date("2026-05-12T00:00:00.000Z"),
    });

    await createTask({
      project: otherProject,
      creator: owner,
      title: "Alpha other project",
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date("2026-05-11T00:00:00.000Z"),
    });

    const response = await request(app)
      .get(`/api/projects/${project.id}/tasks`)
      .query({
        status: "TODO",
        priority: "HIGH",
        assigneeId: assignee.id,
        q: "alpha",
        dueAfter: "2026-05-01",
        dueBefore: "2026-05-31",
      })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.hasMore).toBe(false);
    expect(response.body.data.nextCursor).toBeNull();
    expect(response.body.data.tasks).toHaveLength(1);
    expect(response.body.data.tasks[0].title).toBe("Alpha backend");
  });

  test("supports cursor pagination with deterministic sort", async () => {
    const { project, owner, accessToken } = await createAuthorizedProjectContext();

    await createTask({ project, creator: owner, title: "Alpha" });
    await createTask({ project, creator: owner, title: "Beta" });
    await createTask({ project, creator: owner, title: "Gamma" });

    const firstPage = await request(app)
      .get(`/api/projects/${project.id}/tasks`)
      .query({
        sortBy: "title",
        sortOrder: "asc",
        limit: 2,
      })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data.tasks).toHaveLength(2);
    expect(firstPage.body.data.tasks.map((task) => task.title)).toEqual([
      "Alpha",
      "Beta",
    ]);
    expect(firstPage.body.data.hasMore).toBe(true);
    expect(firstPage.body.data.nextCursor).toEqual(expect.any(String));

    const secondPage = await request(app)
      .get(`/api/projects/${project.id}/tasks`)
      .query({
        sortBy: "title",
        sortOrder: "asc",
        limit: 2,
        cursor: firstPage.body.data.nextCursor,
      })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(secondPage.status).toBe(200);
    expect(secondPage.body.data.tasks).toHaveLength(1);
    expect(secondPage.body.data.tasks[0].title).toBe("Gamma");
    expect(secondPage.body.data.hasMore).toBe(false);
    expect(secondPage.body.data.nextCursor).toBeNull();
  });
});
