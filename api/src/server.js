require('dotenv').config();

const app = require('./app');
const logger = require('./utils/logger');

const port = Number(process.env.API_PORT || process.env.PORT || 3000);

app.listen(port, '0.0.0.0', () => {
  logger.info('ShopLite API started', {
    port,
    version: process.env.APP_VERSION || 'unknown',
  });
});

process.on('uncaughtException', (err) => {
  logger.fatal('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});
