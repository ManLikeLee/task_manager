const asyncHandler = require("../utils/asyncHandler");
const validate = require("../utils/validate");
const { sendSuccess } = require("../utils/response");
const {
  createTaskSchema,
  updateTaskSchema,
  taskProjectParamsSchema,
  taskIdParamsSchema,
} = require("../validators/taskValidator");
const taskService = require("../services/taskService");

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
  const tasks = await taskService.getTasksByProject(projectId, req.user.sub);

  sendSuccess(res, {
    message: "Tasks fetched successfully.",
    data: {
      tasks,
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
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
};
