const { sendSuccess } = require("../utils/response");

const getHealthStatus = (_req, res) => {
  sendSuccess(res, {
    data: {
      status: "healthy",
    },
    message: "API is healthy.",
  });
};

module.exports = {
  getHealthStatus,
};
