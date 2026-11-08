import { devLog } from "../utils/miscFunctions";

async function fetchLandRegistryData(field, value, years) {
  const landRegistryRes = await Promise.all(
    years.map((year) =>
      fetch(
        `https://landregistry.data.gov.uk/data/ppi/transaction-record.json?propertyAddress.${field}=${encodeURIComponent(value)}&min-transactionDate=${year}-01-01&max-transactionDate=${year}-12-31&_page=0&_pageSize=50`,
      ),
    ),
  );

  if (landRegistryRes.some((r) => !r.ok)) {
    throw new Error("Unable to retrieve land registry data. Please try again.");
  }

  return Promise.all(landRegistryRes.map((r) => r.json()));
}

async function getLandRegistryAreaNames(postcode) {
  const locationNames = await fetch(
    `https://landregistry.data.gov.uk/data/ppi/transaction-record.json?propertyAddress.postcode=${postcode}&_pageSize=1`,
  );

  if (!locationNames.ok) {
    throw new Error(
      "Unable to retrieve the property address from Land Registry. Please try again.",
    );
  }

  return locationNames.json() ?? null;
}

export async function getLandRegistryData(
  postcode,
  fallbackLocality,
  fallbackDistrict,
  years,
) {
  const names = await getLandRegistryAreaNames(postcode);

  const locality = names?.result?.items[0]?.propertyAddress?.locality;
  const district = names?.result?.items[0]?.propertyAddress?.district;
  const streetName = names?.result?.items[0]?.propertyAddress?.street;
  let areaUsed;
  let data;

  const localityData = await fetchLandRegistryData("locality", locality, years);

  if (localityData.some((r) => r.result.items.length > 0)) {
    data = localityData;
    areaUsed = "locality";
    devLog("Used land registry locality");
    return { data, locality, district, areaUsed, streetName };
  }

  const districtData = await fetchLandRegistryData("district", district, years);

  if (districtData.some((r) => r.result.items.length > 0)) {
    data = districtData;
    areaUsed = "district";
    devLog("Used land registry district");
    return { data, locality, district, areaUsed, streetName };
  }

  const fallbackLocalityData = await fetchLandRegistryData(
    "locality",
    fallbackLocality,
    years,
  );

  if (fallbackLocalityData.some((r) => r.result.items.length > 0)) {
    data = fallbackLocalityData;
    areaUsed = "locality";
    devLog("Used postcodeio locality");
    return { data, locality, district, areaUsed, streetName };
  }

  data = await fetchLandRegistryData("district", fallbackDistrict, years);
  areaUsed = "district";
  devLog("Used postcodeio district: ", fallbackDistrict);

  return { data, locality, district, areaUsed, streetName };
}
