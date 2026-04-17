const notFoundMiddleware = require("../../../src/middlewares/notFoundMiddleware");

describe("notFoundMiddleware", () => {
  test("returns standard error envelope with requestId", () => {
    const req = {
      requestId: "req-404",
      method: "GET",
      originalUrl: "/api/missing",
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    notFoundMiddleware(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Route not found: /api/missing",
      code: "ROUTE_NOT_FOUND",
      requestId: "req-404",
    });
  });
});
