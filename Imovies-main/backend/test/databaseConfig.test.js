const test = require('node:test');
const assert = require('node:assert/strict');
const { getMongoUri } = require('../config/db');
const validateEnvironment = require('../config/env');

test('requires an explicitly configured Atlas URI and does not fall back to localhost', () => {
  const savedUri = process.env.MONGO_URI;
  const savedLegacyUri = process.env.MONGODB_URI;
  delete process.env.MONGO_URI;
  delete process.env.MONGODB_URI;
  try {
    assert.throws(getMongoUri, /Missing MONGO_URI/);
  } finally {
    if (savedUri === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = savedUri;
    if (savedLegacyUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = savedLegacyUri;
  }
});

test('accepts Atlas SRV format but rejects a local MongoDB URI', () => {
  const savedUri = process.env.MONGO_URI;
  try {
    process.env.MONGO_URI = 'mongodb+srv://sample-user:sample-pass@cluster0.abcd.mongodb.net/imovies';
    assert.equal(getMongoUri(), process.env.MONGO_URI);
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/imovies';
    assert.throws(getMongoUri, /mongodb\+srv/);
  } finally {
    if (savedUri === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = savedUri;
  }
});

test('rejects common Atlas connection-string placeholders', () => {
  const savedUri = process.env.MONGO_URI;
  try {
    for (const uri of [
      'mongodb+srv://username:password@cluster0.example.mongodb.net/imovies',
      'mongodb+srv://<username>:<password>@cluster-name.mongodb.net/imovies',
    ]) {
      process.env.MONGO_URI = uri;
      assert.throws(getMongoUri, /placeholders/);
    }
  } finally {
    if (savedUri === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = savedUri;
  }
});

test('requires a strong, non-placeholder JWT secret before startup', () => {
  const saved = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  };
  try {
    process.env.MONGO_URI = 'mongodb+srv://testuser:testpass@cluster0.abcd.mongodb.net/imovies';
    process.env.PORT = '5000';
    process.env.JWT_EXPIRES_IN = '7d';
    for (const secret of [
      'short',
      'replace-this-with-a-long-example-secret-value',
      'placeholder-secret-value-that-is-long-enough',
      'a'.repeat(32),
    ]) {
      process.env.JWT_SECRET = secret;
      assert.throws(validateEnvironment, /JWT_SECRET/);
    }
    process.env.JWT_SECRET = 'aB3cD4eF5gH6iJ7kL8mN9pQ0rS1tU2vW';
    assert.deepEqual(validateEnvironment(), { port: 5000 });
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
