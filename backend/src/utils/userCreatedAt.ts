import mongoose from 'mongoose';

export const resolveUserCreatedAt = (user: any): Date | undefined => {
  if (!user) return undefined;
  if (user.createdAt) return user.createdAt;

  const rawId = user._id;
  if (rawId && typeof rawId.getTimestamp === 'function') {
    try {
      return rawId.getTimestamp();
    } catch {
      // Continue to ObjectId fallback below.
    }
  }

  if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
    return new mongoose.Types.ObjectId(rawId).getTimestamp();
  }

  return undefined;
};