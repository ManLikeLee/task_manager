const crypto = require("crypto");

const AppError = require("../utils/AppError");
const userDbService = require("./database/userDbService");
const { sendVerificationEmail } = require("./mailService");
const logger = require("../utils/logger");
const isDevelopment = (process.env.NODE_ENV || "development") !== "production";

const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_ATTEMPT_LIMIT = Number(
  process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS || 5,
);
const VERIFICATION_CODE_TTL_MINUTES = Number(
  process.env.EMAIL_VERIFICATION_CODE_TTL_MINUTES || 15,
);
const VERIFICATION_RESEND_COOLDOWN_SECONDS = Number(
  process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS || 60,
);

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const hashCode = (code) =>
  crypto.createHash("sha256").update(String(code)).digest("hex");

const generateVerificationCode = () => {
  const min = 10 ** (VERIFICATION_CODE_LENGTH - 1);
  const max = 10 ** VERIFICATION_CODE_LENGTH;
  const random = crypto.randomInt(min, max);
  return String(random);
};

const addMinutes = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

const canResend = (lastSentAt) => {
  if (!lastSentAt) return true;
  const diffMs = Date.now() - new Date(lastSentAt).getTime();
  return diffMs >= VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000;
};

const persistCodeForUser = async (userId, code) => {
  const expiresAt = addMinutes(VERIFICATION_CODE_TTL_MINUTES);
  const codeHash = hashCode(code);

  await userDbService.updateUser(userId, {
    emailVerificationCodeHash: codeHash,
    emailVerificationExpiresAt: expiresAt,
    emailVerificationAttempts: 0,
    emailVerificationLastSentAt: new Date(),
  });
};

const issueVerificationCode = async (user, { force = false } = {}) => {
  if (!force && !canResend(user.emailVerificationLastSentAt)) {
    throw new AppError(
      `Please wait ${VERIFICATION_RESEND_COOLDOWN_SECONDS} seconds before requesting a new code.`,
      429,
      null,
      "VERIFICATION_RESEND_RATE_LIMITED",
    );
  }

  logger.info("auth.verification_code_generating", {
    email: user.email,
  });
  const code = generateVerificationCode();
  if (isDevelopment) {
    logger.info("auth.verification_code_generated_dev", {
      email: user.email,
      code,
    });
  }
  await persistCodeForUser(user.id, code);
  logger.info("auth.verification_code_persisted", {
    email: user.email,
    expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
  });
  const delivery = await sendVerificationEmail({
    email: user.email,
    code,
    expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
  });
  logger.info("auth.verification_delivery_result", {
    email: user.email,
    delivered: delivery.delivered,
    mode: delivery.mode,
    reason: delivery.reason,
  });

  return {
    expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
    delivery,
  };
};

const ensureVerificationCodeIsValid = (user, submittedCode) => {
  if (user.emailVerified) {
    throw new AppError("Email is already verified.", 400, null, "EMAIL_ALREADY_VERIFIED");
  }

  if (user.emailVerificationAttempts >= VERIFICATION_ATTEMPT_LIMIT) {
    throw new AppError(
      "Too many invalid attempts. Request a new verification code.",
      429,
      null,
      "VERIFICATION_ATTEMPTS_EXCEEDED",
    );
  }

  if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
    throw new AppError(
      "No verification code found. Request a new code.",
      400,
      null,
      "VERIFICATION_CODE_NOT_FOUND",
    );
  }

  if (new Date(user.emailVerificationExpiresAt).getTime() < Date.now()) {
    throw new AppError(
      "Verification code has expired. Request a new code.",
      400,
      null,
      "VERIFICATION_CODE_EXPIRED",
    );
  }

  const submittedHash = hashCode(submittedCode);
  const expectedBuffer = Buffer.from(user.emailVerificationCodeHash, "hex");
  const submittedBuffer = Buffer.from(submittedHash, "hex");

  const isValid =
    expectedBuffer.length === submittedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, submittedBuffer);

  return isValid;
};

const markInvalidAttempt = async (userId, currentAttempts) =>
  userDbService.updateUser(userId, {
    emailVerificationAttempts: currentAttempts + 1,
  });

const markEmailVerified = async (userId) =>
  userDbService.updateUser(userId, {
    emailVerified: true,
    emailVerifiedAt: new Date(),
    emailVerificationCodeHash: null,
    emailVerificationExpiresAt: null,
    emailVerificationAttempts: 0,
    emailVerificationLastSentAt: null,
  });

module.exports = {
  normalizeEmail,
  hashCode,
  issueVerificationCode,
  ensureVerificationCodeIsValid,
  markInvalidAttempt,
  markEmailVerified,
  VERIFICATION_ATTEMPT_LIMIT,
  VERIFICATION_CODE_TTL_MINUTES,
};
