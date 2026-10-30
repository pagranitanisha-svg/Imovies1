const mongoose = require('mongoose');

const getMongoUri = () => {
  const mongoUri = process.env.MONGO_URI?.trim();

  if (!mongoUri) {
    throw new Error('Missing MONGO_URI. Set it in backend/.env to your MongoDB Atlas connection string.');
  }
  if (!mongoUri.startsWith('mongodb+srv://')) {
    throw new Error('MONGO_URI must use the MongoDB Atlas mongodb+srv:// format.');
  }
  const uriHost = mongoUri.match(/@([^/?#]+)/)?.[1]?.split(':')[0];
  const containsCredentialPlaceholder = /(?:<[^>]*>|\b(?:username|password|placeholder|replace|changeme)\b|your[_-])/i.test(mongoUri);
  const containsHostPlaceholder = uriHost
    ? /^(?:cluster(?:-name)?|example|placeholder)(?:\.|$)|\.(?:example|placeholder)\./i.test(uriHost)
    : false;
  if (containsCredentialPlaceholder || containsHostPlaceholder) {
    throw new Error('MONGO_URI still contains example placeholders. Replace them with your Atlas values.');
  }

  return mongoUri;
};

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);
mongoose.connection.on('connected', () => console.log('MongoDB connection event: connected'));
mongoose.connection.on('error', (error) => {
  console.error(`MongoDB connection event: error (${error.name || 'unknown error'})`);
});
mongoose.connection.on('disconnected', () => console.warn('MongoDB connection event: disconnected'));

const connectDB = async (uri = getMongoUri()) => {
  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
    });

    console.log(`MongoDB connected successfully: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('MongoDB connection failed. Verify MONGO_URI in backend/.env and ensure Atlas network access is enabled.');
    console.error(`Connection error type: ${error.name || 'unknown error'}`);
    throw error;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected successfully.');
};

module.exports = { connectDB, disconnectDB, getMongoUri };
