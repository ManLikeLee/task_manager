const sendSuccess = (
  res,
  { statusCode = 200, message = "Request completed successfully.", data = null },
) =>
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });

module.exports = {
  sendSuccess,
};
