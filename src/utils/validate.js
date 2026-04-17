const AppError = require("./AppError");

const validate = (schema, payload) => {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new AppError(
      "Validation failed.",
      400,
      result.error.issues.map((issue) => issue.message),
      "VALIDATION_ERROR",
    );
  }

  return result.data;
};

module.exports = validate;
