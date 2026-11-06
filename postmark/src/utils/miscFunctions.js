export function capitaliseFirstLetter(string) {
  const splitString = string.split(" ");
  var newString = "";
  splitString.forEach((word) => {
    const firstLetter = word.charAt(0).toUpperCase();
    const restOfWord = word.slice(1).toLowerCase();

    newString = newString + firstLetter + restOfWord + " ";
  });

  return newString.trimEnd();
}

export function placeNameToUse(
  areaName,
  areaLevel,
  adminDistrict,
  county,
  useCase,
) {
  if (
    (areaLevel == "lowest" || areaLevel == "low") &&
    useCase == "detailcard"
  ) {
    return `${capitaliseFirstLetter(areaName)} area`;
  } else if (
    (areaLevel != "lowest" || areaLevel != "low") &&
    useCase == "detailcard"
  ) {
    return `${capitaliseFirstLetter(areaName)} (district-wide)`;
  }

  if ((areaLevel == "lowest" || areaLevel == "low") && useCase == "header") {
    return `${capitaliseFirstLetter(areaName)}, ${capitaliseFirstLetter(adminDistrict)}`;
  } else if (
    (areaLevel != "lowest" || areaLevel != "low") &&
    useCase == "header"
  ) {
    return `${capitaliseFirstLetter(adminDistrict)}, ${capitaliseFirstLetter(county)}`;
  }

  return "-";
}
