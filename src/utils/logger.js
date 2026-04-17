const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const serializedMeta = meta ? ` ${JSON.stringify(meta)}` : "";

  return `[${timestamp}] ${level.toUpperCase()}: ${message}${serializedMeta}`;
};

const info = (message, meta) => {
  console.log(formatMessage("info", message, meta));
};

const warn = (message, meta) => {
  console.warn(formatMessage("warn", message, meta));
};

const error = (message, meta) => {
  console.error(formatMessage("error", message, meta));
};

module.exports = {
  info,
  warn,
  error,
};
