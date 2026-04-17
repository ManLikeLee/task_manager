const prisma = require("../../src/prisma/client");

const isSafeTestDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl || typeof databaseUrl !== "string") {
    return false;
  }

  return /test/i.test(databaseUrl);
};

const resolveTestDatabaseUrl = () => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }

  return process.env.DATABASE_URL;
};

const ensureSafeTestDatabase = () => {
  const databaseUrl = resolveTestDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL for tests. Set TEST_DATABASE_URL or DATABASE_URL in .env.test.",
    );
  }

  if (!isSafeTestDatabaseUrl(databaseUrl)) {
    throw new Error(
      "Refusing to run integration tests against a non-test database URL.",
    );
  }
};

const resetDatabase = async () => {
  await prisma.$transaction([
    prisma.task.deleteMany(),
    prisma.project.deleteMany(),
    prisma.workspaceMember.deleteMany(),
    prisma.workspace.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

const disconnectDatabase = async () => {
  await prisma.$disconnect();
};

module.exports = {
  disconnectDatabase,
  ensureSafeTestDatabase,
  isSafeTestDatabaseUrl,
  resetDatabase,
};
