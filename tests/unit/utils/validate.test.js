const { z } = require("zod");

const validate = require("../../../src/utils/validate");
const AppError = require("../../../src/utils/AppError");

describe("validate", () => {
  test("returns parsed payload when validation succeeds", () => {
    const schema = z.object({
      email: z.string().trim().toLowerCase().email(),
    });

    const result = validate(schema, { email: " USER@Example.com " });

    expect(result).toEqual({ email: "user@example.com" });
  });

  test("throws AppError with validation issues when validation fails", () => {
    const schema = z.object({
      name: z.string().min(2, "Name too short"),
    });

    expect(() => validate(schema, { name: "A" })).toThrow(AppError);

    try {
      validate(schema, { name: "A" });
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Validation failed.");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.errors).toContain("Name too short");
    }
  });
});
