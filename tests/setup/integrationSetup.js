const {
  disconnectDatabase,
  ensureSafeTestDatabase,
  resetDatabase,
} = require("../helpers/db");

beforeAll(async () => {
  ensureSafeTestDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});
