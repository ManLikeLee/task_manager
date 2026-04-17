require("dotenv").config();

const app = require("./src/app");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info("Server is running.", {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });
});
