module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/unit"],
  setupFiles: ["<rootDir>/tests/setup/sharedSetup.js"],
  clearMocks: true,
  restoreMocks: true,
};
