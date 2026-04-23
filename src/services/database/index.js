const userDbService = require("./userDbService");
const workspaceDbService = require("./workspaceDbService");
const workspaceMemberDbService = require("./workspaceMemberDbService");
const projectDbService = require("./projectDbService");
const taskDbService = require("./taskDbService");
const taskCommentDbService = require("./taskCommentDbService");
const teamDbService = require("./teamDbService");
const teamMemberDbService = require("./teamMemberDbService");

module.exports = {
  users: userDbService,
  workspaces: workspaceDbService,
  workspaceMembers: workspaceMemberDbService,
  projects: projectDbService,
  tasks: taskDbService,
  taskComments: taskCommentDbService,
  teams: teamDbService,
  teamMembers: teamMemberDbService,
};
