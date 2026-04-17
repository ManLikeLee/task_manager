const REFRESH_COOKIE_NAME = "refreshToken";

const parseCookieSameSite = () => {
  const value = process.env.COOKIE_SAMESITE;

  if (!value) {
    return "strict";
  }

  const normalized = value.toLowerCase();

  if (["strict", "lax", "none"].includes(normalized)) {
    return normalized;
  }

  return "strict";
};

const parseCookieSecure = () => {
  const value = process.env.COOKIE_SECURE;

  if (value === undefined) {
    return process.env.NODE_ENV === "production";
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const getRefreshCookieOptions = () => {
  const domain = process.env.COOKIE_DOMAIN;

  return {
    httpOnly: true,
    secure: parseCookieSecure(),
    sameSite: parseCookieSameSite(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
    ...(domain ? { domain } : {}),
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
