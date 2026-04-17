const bcrypt = require("bcrypt");

const userDbService = require("./database/userDbService");
const AppError = require("../utils/AppError");
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} = require("../utils/token");

const toSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createUser = async ({ name, email, passwordHash }) =>
  userDbService.createUser({
    name,
    email: email.toLowerCase(),
    passwordHash,
  });

const findUserByEmail = async (email) =>
  userDbService.getUserByEmail(email.toLowerCase());

const findUserById = async (id) => userDbService.getUserById(id);

const findUserByRefreshTokenHash = async (refreshTokenHash) =>
  userDbService.getUserByRefreshTokenHash(refreshTokenHash);

const updateRefreshToken = async (userId, refreshTokenHash) =>
  userDbService.updateUser(userId, {
    refreshTokenHash,
  });

const clearRefreshToken = async (userId) =>
  userDbService.updateUser(userId, {
    refreshTokenHash: null,
  });

const registerUser = async (payload) => {
  const existingUser = await findUserByEmail(payload.email);

  if (existingUser) {
    throw new AppError("User already exists with this email.", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await createUser({
    name: payload.name,
    email: payload.email,
    passwordHash,
  });

  return {
    user,
  };
};

const loginUser = async (payload) => {
  const userRecord = await findUserByEmail(payload.email);

  if (!userRecord) {
    throw new AppError("Invalid email or password.", 401);
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    userRecord.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", 401);
  }

  const tokenPayload = {
    sub: userRecord.id,
    email: userRecord.email,
  };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await updateRefreshToken(userRecord.id, hashToken(refreshToken));

  return {
    accessToken,
    refreshToken,
    user: toSafeUser(userRecord),
  };
};

const refreshUserAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required.", 401, null, "REFRESH_TOKEN_REQUIRED");
  }

  const decoded = verifyRefreshToken(refreshToken);
  const userRecord = await findUserById(decoded.sub);

  if (!userRecord || userRecord.refreshTokenHash !== hashToken(refreshToken)) {
    throw new AppError("Refresh token is invalid.", 401, null, "INVALID_REFRESH_TOKEN");
  }

  const tokenPayload = {
    sub: userRecord.id,
    email: userRecord.email,
  };
  const nextRefreshToken = generateRefreshToken(tokenPayload);

  await updateRefreshToken(userRecord.id, hashToken(nextRefreshToken));

  return {
    accessToken: generateAccessToken(tokenPayload),
    refreshToken: nextRefreshToken,
  };
};

const logoutUser = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  const userRecord = await findUserByRefreshTokenHash(hashToken(refreshToken));

  if (userRecord) {
    await clearRefreshToken(userRecord.id);
  }
};

const getSafeCurrentUser = async (userId) => {
  const userRecord = await findUserById(userId);

  if (!userRecord) {
    throw new AppError("User not found.", 404);
  }

  return {
    user: toSafeUser(userRecord),
  };
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByRefreshTokenHash,
  updateRefreshToken,
  clearRefreshToken,
  registerUser,
  loginUser,
  refreshUserAccessToken,
  logoutUser,
  getSafeCurrentUser,
  toSafeUser,
};
