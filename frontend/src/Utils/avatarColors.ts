const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A8E6CF',
  '#FFD3B6', '#FFAAA5', '#FF8B94', '#A8D8EA', '#AA96DA'
];

export function getRandomAvatarColor(friendId: string): string {
  // Use the friend ID as a seed to ensure same color on re-renders
  const hash = friendId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getRandomColor(): string {
  // Return a random color from the palette
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}