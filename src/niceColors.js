export const niceColors = [
  '#FF79C6', // Pink
  '#50FA7B', // Green
  '#C778DD', // Violet
  '#62AEEF', // Blue
  '#FF6E6E', // Red
  '#A7B7D6', // Light Blue
];

export function getRandomNiceColor() {
  return niceColors[Math.floor(Math.random() * niceColors.length)];
}
