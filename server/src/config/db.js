import mongoose from 'mongoose';

export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in the environment');
  }

  mongoose.connection.on('connected', () => console.log('MongoDB connected'));
  mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err.message));

  await mongoose.connect(process.env.MONGODB_URI);
}
