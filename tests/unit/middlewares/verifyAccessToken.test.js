const verifyAccessTokenMiddleware = require("../../../src/middlewares/verifyAccessToken");
const AppError = require("../../../src/utils/AppError");

describe("verifyAccessTokenMiddleware", () => {
  test("returns ACCESS_TOKEN_REQUIRED app error when auth header is missing", () => {
    const req = { headers: {} };
    const next = jest.fn();

    verifyAccessTokenMiddleware(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Access token is required.");
    expect(error.code).toBe("ACCESS_TOKEN_REQUIRED");
  });
});
