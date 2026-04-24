const { z } = require("zod");

const cuidOrUuidMessage = "Must be a valid ID.";

const workspaceIdParamsSchema = z.object({
  workspaceId: z.string().trim().uuid(cuidOrUuidMessage),
});

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required.")
    .max(120, "Workspace name must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer.")
    .optional()
    .nullable(),
});

const createWorkspaceInviteSchema = z.object({
  roleToAssign: z.enum(["ADMIN", "MEMBER"]).optional(),
  expiresAt: z
    .string()
    .trim()
    .datetime("expiresAt must be a valid ISO date-time.")
    .optional(),
});

const joinWorkspaceSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Workspace code is required.")
    .max(64, "Workspace code must be 64 characters or fewer."),
});

module.exports = {
  workspaceIdParamsSchema,
  createWorkspaceSchema,
  createWorkspaceInviteSchema,
  joinWorkspaceSchema,
};
