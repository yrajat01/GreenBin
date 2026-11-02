/**
 * GreenBin Structured Logger
 * Provides consistent console logging with timestamping and levels.
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const formatMessage = (level, message, meta = '') => {
  const timestamp = new Date().toISOString();
  const metaString = meta && typeof meta === 'object' ? JSON.stringify(meta) : meta;
  return `[${timestamp}] [${level}] ${message} ${metaString}`.trim();
};

const logger = {
  info: (msg, meta) => console.log(formatMessage(LOG_LEVELS.INFO, msg, meta)),
  warn: (msg, meta) => console.warn(formatMessage(LOG_LEVELS.WARN, msg, meta)),
  error: (msg, meta) => console.error(formatMessage(LOG_LEVELS.ERROR, msg, meta)),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage(LOG_LEVELS.DEBUG, msg, meta));
    }
  },
};

module.exports = logger;

