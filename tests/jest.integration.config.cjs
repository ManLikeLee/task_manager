module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/integration"],
  setupFiles: ["<rootDir>/tests/setup/sharedSetup.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/integrationSetup.js"],
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
};
