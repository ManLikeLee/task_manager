const { z } = require("zod");

const taskStatusEnum = z.enum([
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "BLOCKED",
]);

const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const cuidOrUuidMessage = "Must be a valid ID.";

const baseTaskFields = {
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(255, "Title must be 255 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be 5000 characters or fewer.")
    .optional()
    .nullable(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: z.coerce.date().optional().nullable(),
  assigneeId: z
    .string()
    .trim()
    .uuid(cuidOrUuidMessage)
    .optional()
    .nullable(),
};

const createTaskSchema = z.object({
  projectId: z.string().trim().uuid(cuidOrUuidMessage),
  ...baseTaskFields,
});

const updateTaskSchema = z
  .object({
    title: baseTaskFields.title.optional(),
    description: baseTaskFields.description,
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
    dueDate: z.coerce.date().optional().nullable(),
    assigneeId: z
      .union([z.string().trim().uuid(cuidOrUuidMessage), z.null()])
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update.",
  });

const taskProjectParamsSchema = z.object({
  projectId: z.string().trim().uuid(cuidOrUuidMessage),
});

const taskIdParamsSchema = z.object({
  id: z.string().trim().uuid(cuidOrUuidMessage),
});

const taskListSortByEnum = z.enum([
  "createdAt",
  "updatedAt",
  "dueDate",
  "priority",
  "status",
  "title",
]);

const taskListSortOrderEnum = z.enum(["asc", "desc"]);

const taskListQuerySchema = z
  .object({
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
    assigneeId: z.string().trim().uuid(cuidOrUuidMessage).optional(),
    q: z.string().trim().min(1).max(255).optional(),
    dueBefore: z.coerce.date().optional(),
    dueAfter: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z.string().trim().uuid(cuidOrUuidMessage).optional(),
    sortBy: taskListSortByEnum.default("createdAt"),
    sortOrder: taskListSortOrderEnum.default("desc"),
  })
  .refine(
    (value) =>
      !value.dueBefore || !value.dueAfter || value.dueAfter <= value.dueBefore,
    {
      message: "dueAfter must be before or equal to dueBefore.",
      path: ["dueAfter"],
    },
  );

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskProjectParamsSchema,
  taskIdParamsSchema,
  taskListQuerySchema,
};
