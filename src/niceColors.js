export const niceColors = [
  '#50FA7B', // Green
  '#C778DD', // Violet
  '#62AEEF', // Blue
  '#FF6E6E', // Red
  '#A7B7D6', // Light Blue
  '#F1FA8C', // Yellow
];

export function getRandomNiceColor() {
  return niceColors[Math.floor(Math.random() * niceColors.length)];
}
