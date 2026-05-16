const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../utils/validate");
const { sendSuccess } = require("../utils/response");
const {
  clearRefreshTokenCookie,
  getCookieValue,
  setRefreshTokenCookie,
} = require("../utils/cookies");
const {
  loginSchema,
  registerSchema,
  resendVerificationCodeSchema,
  verifyEmailSchema,
} = require("../validators/authValidator");

const register = asyncHandler(async (req, res) => {
  const payload = validate(registerSchema, req.body);
  const data = await authService.registerUser(payload);
  const registerMessage =
    data.emailDelivery?.mode === "dev_console"
      ? "User registered. Email not configured. Verification code logged in server console."
      : "User registered successfully.";

  sendSuccess(res, {
    statusCode: 201,
    message: registerMessage,
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const payload = validate(loginSchema, req.body);
  const data = await authService.loginUser(payload);

  if (data.requiresEmailVerification) {
    clearRefreshTokenCookie(res);
    sendSuccess(res, {
      message: "Please verify your email to continue.",
      data: {
        requiresEmailVerification: true,
        email: data.email,
        user: data.user,
        emailDelivery: data.emailDelivery || null,
        devMode: data.emailDelivery?.mode === "dev_console",
      },
    });
    return;
  }

  setRefreshTokenCookie(res, data.refreshToken);

  sendSuccess(res, {
    message: "Login successful.",
    data: {
      accessToken: data.accessToken,
      user: data.user,
    },
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const payload = validate(verifyEmailSchema, req.body);
  const data = await authService.verifyEmailCode(payload);

  setRefreshTokenCookie(res, data.refreshToken);

  sendSuccess(res, {
    message: "Email verified successfully.",
    data: {
      accessToken: data.accessToken,
      user: data.user,
      verified: true,
    },
  });
});

const resendVerificationCode = asyncHandler(async (req, res) => {
  const payload = validate(resendVerificationCodeSchema, req.body);
  const data = await authService.resendVerificationCode(payload);

  sendSuccess(res, {
    message:
      data.emailDelivery?.mode === "dev_console"
        ? "Email not configured. Verification code logged in server console."
        : "A new verification code has been sent.",
    data: {
      sent: true,
      emailDelivery: data.emailDelivery || null,
      devMode: data.emailDelivery?.mode === "dev_console",
    },
  });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = getCookieValue(req, "refreshToken");
  const data = await authService.refreshUserAccessToken(refreshToken);

  setRefreshTokenCookie(res, data.refreshToken);

  sendSuccess(res, {
    message: "Access token refreshed successfully.",
    data: {
      accessToken: data.accessToken,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = getCookieValue(req, "refreshToken");
  await authService.logoutUser(refreshToken);

  clearRefreshTokenCookie(res);

  sendSuccess(res, {
    message: "Logout successful.",
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const data = await authService.getSafeCurrentUser(req.user.sub);

  sendSuccess(res, {
    message: "Current user fetched successfully.",
    data,
  });
});

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser,
  verifyEmail,
  resendVerificationCode,
};
