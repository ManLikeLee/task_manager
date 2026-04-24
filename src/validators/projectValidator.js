const { z } = require("zod");

const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required.")
    .max(120, "Project name must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer.")
    .optional()
    .nullable(),
  workspaceId: z.string().trim().uuid("Workspace ID must be a valid ID.").optional(),
  teamId: z.string().trim().uuid("Team ID must be a valid ID.").optional().nullable(),
});

const listProjectsQuerySchema = z.object({
  workspaceId: z.string().trim().uuid("Workspace ID must be a valid ID.").optional(),
});

module.exports = {
  createProjectSchema,
  listProjectsQuerySchema,
};
