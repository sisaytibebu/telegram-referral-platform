/**
 * HTTP server entry point.
 * Connects to the database, then starts Express.
 */
'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { testConnection } = require('./config/database');

const startServer = async () => {
  // Test DB connection on startup (non-fatal in dev so we can work without MySQL)
  const dbOk = await testConnection();
  if (!dbOk) {
    if (env.isProduction()) {
      logger.error('Cannot start in production without a database connection. Exiting.');
      process.exit(1);
    } else {
      logger.warn('Database not connected — server starting anyway (development mode).');
    }
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force exit after 10 seconds
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: String(reason) });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { message: err.message });
    process.exit(1);
  });

  return server;
};

startServer();
