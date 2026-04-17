const asyncHandler = require("../utils/asyncHandler");
const validate = require("../utils/validate");
const { sendSuccess } = require("../utils/response");
const {
  createTaskSchema,
  updateTaskSchema,
  taskProjectParamsSchema,
  taskIdParamsSchema,
  taskListQuerySchema,
} = require("../validators/taskValidator");
const taskService = require("../services/taskService");

const listProjects = asyncHandler(async (req, res) => {
  const projects = await taskService.listProjectsForUser(req.user.sub);

  sendSuccess(res, {
    message: "Projects fetched successfully.",
    data: {
      projects,
    },
  });
});

const createTask = asyncHandler(async (req, res) => {
  const payload = validate(createTaskSchema, req.body);
  const task = await taskService.createTask(payload, req.user.sub);

  sendSuccess(res, {
    statusCode: 201,
    message: "Task created successfully.",
    data: {
      task,
    },
  });
});

const getTasksByProject = asyncHandler(async (req, res) => {
  const { projectId } = validate(taskProjectParamsSchema, req.params);
  const query = validate(taskListQuerySchema, req.query);
  const { tasks, nextCursor, hasMore } = await taskService.getTasksByProject(
    projectId,
    query,
    req.user.sub,
  );

  sendSuccess(res, {
    message: "Tasks fetched successfully.",
    data: {
      tasks,
      nextCursor,
      hasMore,
    },
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const { id } = validate(taskIdParamsSchema, req.params);
  const payload = validate(updateTaskSchema, req.body);
  const task = await taskService.updateTask(id, payload, req.user.sub);

  sendSuccess(res, {
    message: "Task updated successfully.",
    data: {
      task,
    },
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = validate(taskIdParamsSchema, req.params);
  await taskService.deleteTask(id, req.user.sub);

  sendSuccess(res, {
    message: "Task deleted successfully.",
  });
});

module.exports = {
  listProjects,
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
};
