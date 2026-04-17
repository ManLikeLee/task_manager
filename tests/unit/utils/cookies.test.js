const {
  getRefreshCookieOptions,
} = require("../../../src/utils/cookies");

describe("getRefreshCookieOptions", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "test",
      COOKIE_SAMESITE: undefined,
      COOKIE_SECURE: undefined,
      COOKIE_DOMAIN: undefined,
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("uses safe defaults", () => {
    const options = getRefreshCookieOptions();

    expect(options.sameSite).toBe("strict");
    expect(options.secure).toBe(false);
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/api/auth");
    expect(options.domain).toBeUndefined();
  });

  test("supports COOKIE_SAMESITE, COOKIE_SECURE and COOKIE_DOMAIN", () => {
    process.env.COOKIE_SAMESITE = "none";
    process.env.COOKIE_SECURE = "true";
    process.env.COOKIE_DOMAIN = "example.com";

    const options = getRefreshCookieOptions();

    expect(options.sameSite).toBe("none");
    expect(options.secure).toBe(true);
    expect(options.domain).toBe("example.com");
  });
});
