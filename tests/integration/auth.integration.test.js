const request = require("supertest");

const app = require("../../src/app");

const extractCookieValue = (setCookieHeaders, cookieName) => {
  const cookieHeader = (setCookieHeaders || []).find((header) =>
    header.startsWith(`${cookieName}=`),
  );

  if (!cookieHeader) {
    return null;
  }

  return cookieHeader.split(";")[0].split("=")[1];
};

describe("auth lifecycle", () => {
  test("register, login, me, refresh rotation, and logout via refresh cookie", async () => {
    const email = `auth-${Date.now()}@example.com`;

    const registerResponse = await request(app).post("/api/auth/register").send({
      name: "Auth User",
      email,
      password: "Password123!",
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.success).toBe(true);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email,
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(loginResponse.headers["set-cookie"]).toEqual(expect.any(Array));

    const loginRefreshCookie = extractCookieValue(
      loginResponse.headers["set-cookie"],
      "refreshToken",
    );

    expect(loginRefreshCookie).toEqual(expect.any(String));
    expect(loginResponse.headers["set-cookie"].join(";")).toContain("HttpOnly");
    expect(loginResponse.headers["set-cookie"].join(";")).toContain("SameSite=Strict");

    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.success).toBe(true);
    expect(meResponse.body.data.user.email).toBe(email);

    const refreshResponse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`refreshToken=${loginRefreshCookie}`]);

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.accessToken).toEqual(expect.any(String));

    const rotatedRefreshCookie = extractCookieValue(
      refreshResponse.headers["set-cookie"],
      "refreshToken",
    );

    expect(rotatedRefreshCookie).toEqual(expect.any(String));
    expect(rotatedRefreshCookie).not.toBe(loginRefreshCookie);

    const reusedRefreshResponse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`refreshToken=${loginRefreshCookie}`]);

    expect(reusedRefreshResponse.status).toBe(401);

    const tamperedRefreshResponse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`refreshToken=${rotatedRefreshCookie}tampered`]);

    expect(tamperedRefreshResponse.status).toBe(401);

    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [`refreshToken=${rotatedRefreshCookie}`]);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.success).toBe(true);

    const refreshAfterLogoutResponse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`refreshToken=${rotatedRefreshCookie}`]);

    expect(refreshAfterLogoutResponse.status).toBe(401);
  });
});
