export function capitaliseFirstLetter(string) {
  if (string != undefined) {
    const splitString = string.split(/[ -]/);
    var newString = "";
    splitString.forEach((word) => {
      const firstLetter = word.charAt(0).toUpperCase();
      const restOfWord = word.slice(1).toLowerCase();

      newString = newString + firstLetter + restOfWord + " ";
    });

    return newString.trimEnd();
  }

  return;
}

export function areaToUseOnHousePriceCard(
  areaUsed,
  locality,
  district,
  fallbackDistrict,
) {
  if (areaUsed == "locality") {
    return `${capitaliseFirstLetter(locality)} area`;
  } else if (district != undefined) {
    return `${capitaliseFirstLetter(district)} area`;
  }

  return `${capitaliseFirstLetter(fallbackDistrict)} (district-wide)`;
}

export function areaToUseAsHeader(
  landRegistryLocality,
  landRegistryDistrict,
  postcodeIOLocality,
  postcodeIODisctrict,
) {
  let returnString = "";

  if (landRegistryLocality != undefined) {
    returnString += `${capitaliseFirstLetter(landRegistryLocality)}, `;
  } else {
    returnString += `${capitaliseFirstLetter(postcodeIOLocality)}, `;
  }

  if (landRegistryDistrict != undefined) {
    returnString += capitaliseFirstLetter(landRegistryDistrict);
  } else {
    returnString += capitaliseFirstLetter(postcodeIODisctrict);
  }

  return returnString;
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
