class AppError extends Error {
  constructor(message, statusCode = 500, errors = null, code = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    if (typeof errors === "string" && !code) {
      this.errors = null;
      this.code = errors;
      return;
    }

    this.errors = errors;
    this.code = code;
  }
}

module.exports = AppError;
