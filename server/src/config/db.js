import mongoose from 'mongoose';

// Cached as a module-level singleton so a warm serverless invocation (Vercel) reuses
// the same connection instead of reconnecting per-request, and so a request that lands
// before the first connection attempt resolves awaits that SAME in-flight promise rather
// than racing a second `mongoose.connect()` call.
let connectionPromise = null;

export function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (!connectionPromise) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set in the environment');
    }

    mongoose.connection.on('connected', () => console.log('MongoDB connected'));
    mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err.message));

    connectionPromise = mongoose.connect(process.env.MONGODB_URI).catch((err) => {
      // Let the next request retry from scratch instead of being stuck on a dead promise.
      connectionPromise = null;
      throw err;
    });
  }

  return connectionPromise;
}
