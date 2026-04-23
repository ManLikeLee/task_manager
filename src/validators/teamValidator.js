const { z } = require("zod");

const cuidOrUuidMessage = "Must be a valid ID.";

const workspaceIdParamsSchema = z.object({
  workspaceId: z.string().trim().uuid(cuidOrUuidMessage),
});

const teamIdParamsSchema = z.object({
  teamId: z.string().trim().uuid(cuidOrUuidMessage),
});

const teamMemberIdParamsSchema = z.object({
  memberId: z.string().trim().uuid(cuidOrUuidMessage),
});

const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Team name is required.")
    .max(120, "Team name must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer.")
    .optional()
    .nullable(),
});

const updateTeamSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Team name is required.")
      .max(120, "Team name must be 120 characters or fewer.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or fewer.")
      .optional()
      .nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update.",
  });

const addTeamMemberSchema = z.object({
  userId: z.string().trim().uuid(cuidOrUuidMessage),
  role: z.enum(["LEAD", "MEMBER"]).optional(),
});

const linkProjectTeamSchema = z.object({
  teamId: z.union([z.string().trim().uuid(cuidOrUuidMessage), z.null()]),
});

const projectIdParamsSchema = z.object({
  projectId: z.string().trim().uuid(cuidOrUuidMessage),
});

module.exports = {
  workspaceIdParamsSchema,
  teamIdParamsSchema,
  teamMemberIdParamsSchema,
  projectIdParamsSchema,
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
  linkProjectTeamSchema,
};

