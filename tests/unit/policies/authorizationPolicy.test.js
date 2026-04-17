const {
  canAccessWorkspace,
  canManageTask,
  resolveWorkspaceRole,
} = require("../../../src/policies/authorizationPolicy");

describe("authorizationPolicy", () => {
  const workspace = {
    id: "workspace-id",
    ownerId: "owner-id",
  };

  test("resolves OWNER role for workspace owner", () => {
    expect(resolveWorkspaceRole("owner-id", workspace, null)).toBe("OWNER");
  });

  test("resolves membership role for workspace members", () => {
    expect(
      resolveWorkspaceRole("member-id", workspace, {
        role: "ADMIN",
      }),
    ).toBe("ADMIN");
  });

  test("returns null role for non-members", () => {
    expect(resolveWorkspaceRole("ghost-id", workspace, null)).toBeNull();
  });

  test("allows any owner/member to access workspace", () => {
    expect(canAccessWorkspace("owner-id", workspace, null)).toBe(true);
    expect(
      canAccessWorkspace("member-id", workspace, {
        role: "MEMBER",
      }),
    ).toBe(true);
  });

  test("allows only OWNER/ADMIN to manage tasks", () => {
    expect(canManageTask("owner-id", workspace, null)).toBe(true);
    expect(
      canManageTask("admin-id", workspace, {
        role: "ADMIN",
      }),
    ).toBe(true);
    expect(
      canManageTask("member-id", workspace, {
        role: "MEMBER",
      }),
    ).toBe(false);
    expect(canManageTask("ghost-id", workspace, null)).toBe(false);
  });
});
