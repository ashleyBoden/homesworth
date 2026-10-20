import { medianHousePrice } from "../constants/medianHousePrice";

export function getPriceSummary(vsUKAverage, priceChange) {
  const affordability =
    vsUKAverage < -50000
      ? "significantly more affordable than the UK average"
      : vsUKAverage < 0
        ? "below the UK average"
        : vsUKAverage < 50000
          ? "close to the UK average"
          : "above the UK average";

  const trend =
    priceChange > 5
      ? "with strong price growth over the past few years"
      : priceChange > 0
        ? "with modest price growth"
        : "with prices remaining flat or declining";

  return `${affordability.charAt(0).toUpperCase() + affordability.slice(1)}, ${trend}.`;
}

function processYearData(items) {
  if (!items || items.length === 0) return null;

  const prices = items.map((item) => item.pricePaid).sort((a, b) => a - b);
  const median = Math.floor(prices.length / 2);
  return prices[median];
}

export function getLast5Years() {
  const currentYear = new Date().getFullYear();
  return [
    currentYear - 4,
    currentYear - 3,
    currentYear - 2,
    currentYear - 1,
    currentYear,
  ];
}

function getMostCommonType(items) {
  if (!items || items.length === 0) return null;

  const tally = {};

  items.forEach((item) => {
    const type = item.propertyType.prefLabel[0]._value;
    tally[type] = (tally[type] || 0) + 1;
  });

  const mostCommon = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
  return mostCommon;
}

export function housePriceData(housingData) {
  const priceByYear = housingData
    ? housingData.map((yearData) => processYearData(yearData.result.items))
    : null;

  const currentPrice = priceByYear?.findLast((price) => price !== null);

  const previousPrice = priceByYear
    ?.slice(0, -1)
    .findLast((price) => price !== null);

  const priceChange =
    currentPrice && previousPrice
      ? (((currentPrice - previousPrice) / previousPrice) * 100).toFixed(1)
      : null;

  const vsUKAverage = currentPrice ? currentPrice - medianHousePrice : null;

  const vsUKAverageFormatted =
    vsUKAverage === null
      ? null
      : vsUKAverage >= 0
        ? `+£${vsUKAverage.toLocaleString()}`
        : `-£${Math.abs(vsUKAverage).toLocaleString()}`;

  const allTransactions = housingData
    ? housingData.flatMap((yearData) => yearData.result.items || [])
    : [];

  const mostCommonType = getMostCommonType(allTransactions);

  const years = getLast5Years();

  const priceChartData = years
    .map((year, index) => ({
      year: year.toString(),
      price: priceByYear?.[index] ?? null,
    }))
    .filter((d) => d.price !== null);

  return {
    priceByYear,
    currentPrice,
    priceChange,
    vsUKAverage,
    vsUKAverageFormatted,
    mostCommonType,
    priceChartData
  };
}
