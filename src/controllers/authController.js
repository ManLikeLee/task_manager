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
} = require("../validators/authValidator");

const register = asyncHandler(async (req, res) => {
  const payload = validate(registerSchema, req.body);
  const data = await authService.registerUser(payload);

  sendSuccess(res, {
    statusCode: 201,
    message: "User registered successfully.",
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const payload = validate(loginSchema, req.body);
  const data = await authService.loginUser(payload);
  setRefreshTokenCookie(res, data.refreshToken);

  sendSuccess(res, {
    message: "Login successful.",
    data: {
      accessToken: data.accessToken,
      user: data.user,
    },
  });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = getCookieValue(req, "refreshToken");
  const data = await authService.refreshUserAccessToken(refreshToken);

  sendSuccess(res, {
    message: "Access token refreshed successfully.",
    data,
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
};
