const handleTokenExpiration = require("../../../src/middlewares/handleTokenExpiration");

describe("handleTokenExpiration", () => {
  test("maps token expiry to standard envelope", () => {
    const req = { requestId: "req-exp" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    handleTokenExpiration({ name: "TokenExpiredError" }, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token has expired.",
      code: "TOKEN_EXPIRED",
      requestId: "req-exp",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("maps invalid token to standard envelope", () => {
    const req = { requestId: "req-inv" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    handleTokenExpiration({ name: "JsonWebTokenError" }, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid token.",
      code: "INVALID_TOKEN",
      requestId: "req-inv",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
