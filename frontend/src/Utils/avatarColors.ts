const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A8E6CF',
  '#FFD3B6', '#FFAAA5', '#FF8B94', '#A8D8EA', '#AA96DA'
];

export function getRandomColor(): string {
  // Return a random color from the palette
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
