let currentIndex = 0;

export const niceColors = [
  '#50FA7B', // Green
  '#C778DD', // Violet
  '#62AEEF', // Blue
  '#FF6E6E', // Red
  '#A7B7D6', // Light Blue
  '#F1FA8C', // Yellow
];

export function getRandomNiceColor() {
  const color = niceColors[currentIndex];
  currentIndex++;
  if (currentIndex > niceColors.length-1) {
    currentIndex = 0;
  }
  return color;
}
