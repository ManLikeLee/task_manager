const userDbService = require("./userDbService");
const workspaceDbService = require("./workspaceDbService");
const workspaceMemberDbService = require("./workspaceMemberDbService");
const projectDbService = require("./projectDbService");
const taskDbService = require("./taskDbService");

module.exports = {
  users: userDbService,
  workspaces: workspaceDbService,
  workspaceMembers: workspaceMemberDbService,
  projects: projectDbService,
  tasks: taskDbService,
};
