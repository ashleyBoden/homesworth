function isConnector(word) {
  if (word && ["ON", "UPON", "AND"].includes(word.toUpperCase())) {
    return true;
  }

  return false;
}

function capitaliseFirstLetter(word) {
  const firstLetter = word.charAt(0).toUpperCase();
  const restOfWord = word.slice(1).toLowerCase();

  return firstLetter + restOfWord;
}

function capitaliseHyphenated(word) {
  const splitByHyphen = word
    .split("-")
    .map((w) => (isConnector(w) ? w.toLowerCase() : capitaliseFirstLetter(w)));

  return splitByHyphen.join("-");
}

function toTitleCase(string) {
  if (!string) return "";

  const splitBySpace = string
    .split(" ")
    .map((word) => capitaliseHyphenated(word));

  return splitBySpace.join(" ");
}

export function areaToUseOnHousePriceCard(
  areaUsed,
  locality,
  district,
  fallbackDistrict,
) {
  if (areaUsed == "locality") {
    return `${toTitleCase(locality)} area`;
  } else if (district != undefined) {
    return `${toTitleCase(district)} area`;
  }

  return `${toTitleCase(fallbackDistrict)} (district-wide)`;
}

export function areaToUseAsHeader(
  landRegistryStreetName,
  landRegistryLocality,
  landRegistryDistrict,
  postcodeIODistrict,
  postcodeIOCounty,
) {
  const names = [
    landRegistryStreetName,
    landRegistryLocality,
    landRegistryDistrict,
    postcodeIODistrict,
    postcodeIOCounty,
  ]
    .filter(Boolean)
    .map((name) => name.toUpperCase());

  const uniqueNames = [...new Set(names)];

  const namesToUse = uniqueNames.slice(0, 2).join(", ");

  return toTitleCase(namesToUse);
}

export function devLog(...args) {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}

export function devLogTable(...args) {
  if (import.meta.env.DEV) {
    console.table(...args);
  }
}
