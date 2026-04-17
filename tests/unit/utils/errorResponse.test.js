const {
  formatErrorResponse,
  sendError,
} = require("../../../src/utils/errorResponse");

describe("errorResponse", () => {
  test("formats required envelope and optional fields", () => {
    const payload = formatErrorResponse({
      statusCode: 400,
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      errors: ["Email is required."],
      requestId: "req-1",
    });

    expect(payload).toEqual({
      success: false,
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      errors: ["Email is required."],
      requestId: "req-1",
    });
  });

  test("derives a default code from status when missing", () => {
    const payload = formatErrorResponse({
      statusCode: 404,
      message: "Missing",
    });

    expect(payload).toEqual({
      success: false,
      message: "Missing",
      code: "NOT_FOUND",
    });
  });

  test("sendError writes status and payload", () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    sendError(res, {
      statusCode: 401,
      message: "Invalid token.",
      code: "INVALID_TOKEN",
      requestId: "req-2",
    });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid token.",
      code: "INVALID_TOKEN",
      requestId: "req-2",
    });
  });
});
