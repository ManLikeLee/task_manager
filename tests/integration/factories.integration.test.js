const prisma = require("../../src/prisma/client");
const {
  createProject,
  createTask,
  createUser,
  createWorkspace,
  createWorkspaceMember,
} = require("../helpers/factories");

describe("test factories", () => {
  test("creates a connected workspace, project, and task graph", async () => {
    const owner = await createUser();
    const member = await createUser();
    const workspace = await createWorkspace({ owner });

    await createWorkspaceMember({
      workspace,
      user: member,
      role: "ADMIN",
    });

    const project = await createProject({ workspace });

    const task = await createTask({
      project,
      creator: owner,
      assigneeId: member.id,
      title: "Factory Task",
    });

    const storedTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        project: true,
      },
    });

    expect(storedTask).not.toBeNull();
    expect(storedTask.title).toBe("Factory Task");
    expect(storedTask.project.id).toBe(project.id);
    expect(storedTask.assigneeId).toBe(member.id);
  });
});
