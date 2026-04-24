const prisma = require("../../prisma/client");

const createUser = (data) =>
  prisma.user.create({
    data,
  });

const listUsers = (options = {}) =>
  prisma.user.findMany({
    ...options,
  });

const getUserById = (id, options = {}) =>
  prisma.user.findUnique({
    where: { id },
    ...options,
  });

const getUserByEmail = (email, options = {}) =>
  prisma.user.findUnique({
    where: { email },
    ...options,
  });

const getUserByUsername = (username, options = {}) =>
  prisma.user.findUnique({
    where: { username },
    ...options,
  });

const getUserByRefreshTokenHash = (refreshTokenHash, options = {}) =>
  prisma.user.findFirst({
    where: { refreshTokenHash },
    ...options,
  });

const updateUser = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
  });

const deleteUser = (id) =>
  prisma.user.delete({
    where: { id },
  });

module.exports = {
  createUser,
  listUsers,
  getUserByEmail,
  getUserByUsername,
  getUserById,
  getUserByRefreshTokenHash,
  updateUser,
  deleteUser,
};
