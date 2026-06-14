const logger = require('../utils/logger');

module.exports = function httpLogger(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    logger[level]('http request', {
      method: req.method,
      path: req.originalUrl,
      status,
      duration_ms: Date.now() - startedAt,
      request_id: req.requestId,
    });
  });

  next();
};
