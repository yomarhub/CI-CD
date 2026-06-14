const { randomUUID } = require('crypto');

module.exports = function requestId(req, res, next) {
  req.requestId = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};
