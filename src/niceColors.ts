let currentIndex = 0;

export const niceColors = [
  '#60DB6C', // Green
  '#FF5353', // Red
  '#FFEE58', // Yellow
  '#71FFD4', // Hatsune Miku color
  '#5259FF', // Blue-ish violet
  '#C479FF', // Pink-ish violet
];

export function getRandomNiceColor() {
  const color = niceColors[currentIndex];
  currentIndex++;
  if (currentIndex > niceColors.length-1) {
    currentIndex = 0;
  }
  return color;
}
