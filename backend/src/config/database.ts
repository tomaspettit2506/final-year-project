import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/chessapp';

  const source = process.env.MONGO_URI ? 'MONGO_URI' : process.env.MONGODB_URI ? 'MONGODB_URI' : 'local fallback';
  console.log(`Using MongoDB source: ${source}`);
  console.log(`Connecting to MongoDB (${MONGODB_URI.split('@')[1] || 'local'})...`);

  try {
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
}
