const errorHandlerMiddleware = require("../../../src/middlewares/errorHandlerMiddleware");
const AppError = require("../../../src/utils/AppError");

describe("errorHandlerMiddleware", () => {
  const createRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  });

  const req = {
    requestId: "req-err",
    method: "POST",
    originalUrl: "/api/auth/register",
  };

  test("maps app validation error to standard envelope", () => {
    const res = createRes();
    const err = new AppError(
      "Validation failed.",
      400,
      ["Email is required."],
      "VALIDATION_ERROR",
    );

    errorHandlerMiddleware(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      errors: ["Email is required."],
      requestId: "req-err",
    });
  });

  test("maps Prisma unique error to contract", () => {
    const res = createRes();
    const err = { message: "Unique failed", code: "P2002" };

    errorHandlerMiddleware(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "A record with this value already exists.",
      code: "DUPLICATE_RECORD",
      requestId: "req-err",
    });
  });
});
