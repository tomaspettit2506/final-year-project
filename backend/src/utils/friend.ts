export function ensureFriendsList(user: any): void {
  if (!user.friends) user.friends = [];
}

export function addFriendIfMissing(user: any, target: any): void {
  ensureFriendsList(user);
  const alreadyFriend = user.friends.some((f: any) => {
    const friendUserId = f.friendUser?._id || f.friendUser;
    const targetId = target._id?.toString?.();
    return (
      (friendUserId && friendUserId.toString?.() === targetId) ||
      f.friendFirebaseUid === target.firebaseUid
    );
  });

  if (!alreadyFriend) {
    user.friends.push({
      friendUser: target._id,
      friendFirebaseUid: target.firebaseUid,
      friendName: target.name || target.email,
      friendEmail: target.email,
      friendRating: target.rating
    });
  }
}

export function normalizeFriends(friends: any[]): any[] {
  return (friends || []).map((friend: any) => {
    const populated = friend.friendUser as any;
    return {
      friendUser: friend.friendUser,
      friendFirebaseUid: populated?.firebaseUid || friend.friendFirebaseUid,
      friendName: populated?.name || friend.friendName,
      friendEmail: populated?.email || friend.friendEmail,
      friendRating: populated?.rating ?? friend.friendRating,
      gameRecents: populated?.gameRecents,
      addedAt: friend.addedAt
    };
  });
}

export function removeFriendFromList(
  friendsArr: any[],
  targetId: string,
  targetMongoId?: any
): any[] {
  return (friendsArr || []).filter((f: any) => {
    const byFirebase = f.friendFirebaseUid && f.friendFirebaseUid !== targetId;
    const byMongo = targetMongoId ? f.friendUser?.toString?.() !== targetMongoId.toString?.() : true;
    const byRawId = f.friendUser?.toString?.() !== targetId;
    return byFirebase && byMongo && byRawId;
  });
}