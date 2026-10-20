export function processCrimeData(items) {
  if (!items || items.length === 0) return null;

  const total = items.length;

  const tally = {};
  items.forEach((item) => {
    const category = item.category;
    tally[category] = (tally[category] || 0) + 1;
  });
  const mostCommonCategory = Object.keys(tally).sort(
    (a, b) => tally[b] - tally[a],
  )[0];

  return {
    total,
    mostCommonCategory,
  };
}
