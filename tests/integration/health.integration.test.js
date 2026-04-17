const request = require("supertest");

const app = require("../../src/app");

describe("health endpoints", () => {
  test("GET /api/health returns healthy API status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: "healthy",
      },
      message: "API is healthy.",
    });
  });

  test("GET /api/health/live returns live status", async () => {
    const response = await request(app).get("/api/health/live");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: "live",
      },
      message: "API liveness check passed.",
    });
  });

  test("GET /api/health/ready returns ready status", async () => {
    const response = await request(app).get("/api/health/ready");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: "ready",
      },
      message: "API readiness check passed.",
    });
  });
});
