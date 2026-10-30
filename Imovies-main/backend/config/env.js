const validateEnvironment = () => {
  const { getMongoUri } = require('./db');
  getMongoUri();

  const secret = process.env.JWT_SECRET;
  if (
    !secret
    || secret.length < 32
    || new Set(secret).size < 12
    || /replace|example|placeholder|change.?me|your[_-]|secret123/i.test(secret)
  ) {
    throw new Error('JWT_SECRET must be set in the hosting environment (or backend/.env locally) to a unique secret of at least 32 characters with at least 12 distinct characters.');
  }

  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port between 1 and 65535.');
  }

  const tokenLifetime = process.env.JWT_EXPIRES_IN || '7d';
  if (!/^[1-9]\d*(s|m|h|d)$/.test(tokenLifetime)) {
    throw new Error('JWT_EXPIRES_IN must be a positive number followed by s, m, h, or d.');
  }

  return { port };
};

module.exports = validateEnvironment;
