const serializeLog = (level, msg, meta = {}) =>
  JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    msg,
    ...meta,
  });

const info = (msg, meta) => {
  console.log(serializeLog("info", msg, meta));
};

const warn = (msg, meta) => {
  console.warn(serializeLog("warn", msg, meta));
};

const error = (msg, meta) => {
  console.error(serializeLog("error", msg, meta));
};

module.exports = {
  info,
  warn,
  error,
};
