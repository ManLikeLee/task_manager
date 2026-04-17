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

const buildToken = (user) =>
  generateAccessToken({
    sub: user.id,
    email: user.email,
  });

describe("task authorization by workspace role", () => {
  test("OWNER and ADMIN can manage tasks; MEMBER cannot", async () => {
    const owner = await createUser();
    const admin = await createUser();
    const member = await createUser();
    const workspace = await createWorkspace({ owner });
    const project = await createProject({ workspace });

    await createWorkspaceMember({
      workspace,
      user: admin,
      role: "ADMIN",
    });

    await createWorkspaceMember({
      workspace,
      user: member,
      role: "MEMBER",
    });

    const ownerToken = buildToken(owner);
    const adminToken = buildToken(admin);
    const memberToken = buildToken(member);

    const memberCreateResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        projectId: project.id,
        title: "Member cannot create",
      });

    expect(memberCreateResponse.status).toBe(403);

    const ownerCreateResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        projectId: project.id,
        title: "Owner created",
      });

    expect(ownerCreateResponse.status).toBe(201);

    const taskId = ownerCreateResponse.body.data.task.id;

    const memberUpdateResponse = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        title: "Member update",
      });

    expect(memberUpdateResponse.status).toBe(403);

    const adminUpdateResponse = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Admin update",
      });

    expect(adminUpdateResponse.status).toBe(200);

    const memberDeleteResponse = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(memberDeleteResponse.status).toBe(403);

    const adminDeleteResponse = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminDeleteResponse.status).toBe(200);
  });

  test("non-members are blocked and assignees must belong to workspace", async () => {
    const owner = await createUser();
    const member = await createUser();
    const outsider = await createUser();

    const workspace = await createWorkspace({ owner });
    const project = await createProject({ workspace });

    await createWorkspaceMember({
      workspace,
      user: member,
      role: "MEMBER",
    });

    const ownerToken = buildToken(owner);
    const outsiderToken = buildToken(outsider);

    const outsiderListResponse = await request(app)
      .get(`/api/projects/${project.id}/tasks`)
      .set("Authorization", `Bearer ${outsiderToken}`);

    expect(outsiderListResponse.status).toBe(403);

    const invalidAssigneeResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        projectId: project.id,
        title: "Task with outsider assignee",
        assigneeId: outsider.id,
      });

    expect(invalidAssigneeResponse.status).toBe(400);

    const validTask = await createTask({
      project,
      creator: owner,
      title: "Update assignee target",
    });

    const invalidAssigneeUpdate = await request(app)
      .patch(`/api/tasks/${validTask.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        assigneeId: outsider.id,
      });

    expect(invalidAssigneeUpdate.status).toBe(400);
  });
});
