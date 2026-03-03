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

