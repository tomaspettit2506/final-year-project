import mongoose from 'mongoose';
import { Friend } from '../schemas';

async function migrateLegacyEmbeddedFriends(): Promise<void> {
  try {
    const usersCollection = mongoose.connection.collection('users');
    const legacyUsers = await usersCollection
      .find(
        { 'friends.0': { $exists: true } },
        { projection: { _id: 1, friends: 1 } }
      )
      .toArray();

    if (legacyUsers.length === 0) {
      return;
    }

    const bulkOps: Array<{
      updateOne: {
        filter: { user: mongoose.Types.ObjectId; friendUser: mongoose.Types.ObjectId };
        update: { $setOnInsert: { user: mongoose.Types.ObjectId; friendUser: mongoose.Types.ObjectId; addedAt: Date } };
        upsert: true;
      };
    }> = [];

    for (const legacyUser of legacyUsers as any[]) {
      const userId = legacyUser?._id;
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) continue;

      const legacyFriends = Array.isArray(legacyUser.friends) ? legacyUser.friends : [];
      for (const entry of legacyFriends) {
        const friendUserId = entry?.friendUser;
        if (!friendUserId || !mongoose.Types.ObjectId.isValid(friendUserId)) continue;
        if (String(userId) === String(friendUserId)) continue;

        bulkOps.push({
          updateOne: {
            filter: { user: userId, friendUser: friendUserId },
            update: {
              $setOnInsert: {
                user: userId,
                friendUser: friendUserId,
                addedAt: entry?.addedAt ? new Date(entry.addedAt) : new Date(),
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await Friend.bulkWrite(bulkOps, { ordered: false });
      console.log(`✅ Migrated legacy friendships to Friend collection (${bulkOps.length} upsert ops)`);
    }
  } catch (error) {
    console.error('⚠️ Legacy friends migration failed (continuing startup):', error);
  }
}

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
    await migrateLegacyEmbeddedFriends();
    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
}

export default connectDatabase;
