const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
const currentLevel =
  LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

const SENSITIVE = /password|token|secret|authorization|cookie|key|credential/i;

function sanitize(value, depth = 0) {
  if (depth > 5 || value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [
      k,
      SENSITIVE.test(k) ? '[REDACTED]' : sanitize(v, depth + 1),
    ])
  );
}

function log(level, message, meta = {}) {
  if (LEVELS[level] < currentLevel) return;
  process.stdout.write(
    JSON.stringify({
      level,
      message,
      ...sanitize(meta),
      timestamp: new Date().toISOString(),
    }) + '\n'
  );
}

module.exports = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  fatal: (msg, meta) => log('fatal', msg, meta),
};
