const REFRESH_COOKIE_NAME = "refreshToken";

const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
};

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((cookies, part) => {
    const [rawKey, ...rest] = part.trim().split("=");

    if (!rawKey) {
      return cookies;
    }

    cookies[rawKey] = decodeURIComponent(rest.join("="));
    return cookies;
  }, {});

const getCookieValue = (req, name) => {
  const cookies = parseCookies(req.headers.cookie);

  return cookies[name] || null;
};

module.exports = {
  clearRefreshTokenCookie,
  getCookieValue,
  getRefreshCookieOptions,
  setRefreshTokenCookie,
};
