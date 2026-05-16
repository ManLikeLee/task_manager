const bcrypt = require("bcrypt");

const userDbService = require("./database/userDbService");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const {
  ensureVerificationCodeIsValid,
  issueVerificationCode,
  markEmailVerified,
  markInvalidAttempt,
  normalizeEmail,
} = require("./emailVerificationService");
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} = require("../utils/token");

const toSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  emailVerified: Boolean(user.emailVerified),
  emailVerifiedAt: user.emailVerifiedAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createUser = async ({ name, username, email, passwordHash }) =>
  userDbService.createUser({
    name,
    username: username.toLowerCase(),
    email: normalizeEmail(email),
    passwordHash,
    emailVerified: false,
    emailVerifiedAt: null,
  });

const findUserByEmail = async (email) =>
  userDbService.getUserByEmail(normalizeEmail(email));

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
  const email = normalizeEmail(payload.email);
  const username = payload.username.trim().toLowerCase();
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new AppError("User already exists with this email.", 409);
  }

  const existingUsername = await userDbService.getUserByUsername(
    username,
    { select: { id: true } },
  );

  if (existingUsername) {
    throw new AppError("Username is already taken.", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await createUser({
    name: payload.name,
    username,
    email,
    passwordHash,
  });
  logger.info("auth.register_user_created", {
    userId: user.id,
    email: user.email,
  });
  const verification = await issueVerificationCode(user, { force: true });

  return {
    user: toSafeUser(user),
    requiresEmailVerification: true,
    email: user.email,
    emailDelivery: verification.delivery,
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

  if (!userRecord.emailVerified) {
    logger.info("auth.login_unverified_user", {
      userId: userRecord.id,
      email: userRecord.email,
    });
    try {
      const verification = await issueVerificationCode(userRecord, { force: false });
      return {
        requiresEmailVerification: true,
        email: userRecord.email,
        user: toSafeUser(userRecord),
        emailDelivery: verification.delivery,
      };
    } catch (error) {
      // Ignore resend cooldown here; user can still verify with existing code.
      if (error.code !== "VERIFICATION_RESEND_RATE_LIMITED") {
        throw error;
      }
      return {
        requiresEmailVerification: true,
        email: userRecord.email,
        user: toSafeUser(userRecord),
      };
    }
  }

  const tokenPayload = {
    sub: userRecord.id,
    email: userRecord.email,
    emailVerified: userRecord.emailVerified,
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
    emailVerified: userRecord.emailVerified,
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

const verifyEmailCode = async ({ email, code }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await userDbService.getUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("Invalid verification code.", 400, null, "INVALID_VERIFICATION_CODE");
  }

  if (user.emailVerified) {
    throw new AppError(
      "Email is already verified. Please sign in.",
      400,
      null,
      "EMAIL_ALREADY_VERIFIED",
    );
  }

  const isValid = ensureVerificationCodeIsValid(user, code);
  if (!isValid) {
    await markInvalidAttempt(user.id, user.emailVerificationAttempts || 0);
    throw new AppError("Invalid verification code.", 400, null, "INVALID_VERIFICATION_CODE");
  }

  const verifiedUser = await markEmailVerified(user.id);
  const tokenPayload = {
    sub: verifiedUser.id,
    email: verifiedUser.email,
    emailVerified: true,
  };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  await updateRefreshToken(verifiedUser.id, hashToken(refreshToken));

  return {
    accessToken,
    refreshToken,
    user: toSafeUser(verifiedUser),
  };
};

const resendVerificationCode = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await userDbService.getUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("No account found for this email.", 404, null, "EMAIL_NOT_FOUND");
  }
  if (user.emailVerified) {
    throw new AppError(
      "Email is already verified. Please sign in.",
      400,
      null,
      "EMAIL_ALREADY_VERIFIED",
    );
  }

  logger.info("auth.resend_verification_requested", {
    userId: user.id,
    email: user.email,
  });
  const verification = await issueVerificationCode(user, { force: false });

  return {
    success: true,
    emailDelivery: verification.delivery,
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
  verifyEmailCode,
  resendVerificationCode,
  toSafeUser,
};
