export async function fetchLandRegistryData(field, value, years) {
  const landRegistryRes = await Promise.all(
    years.map((year) =>
      fetch(
        `https://landregistry.data.gov.uk/data/ppi/transaction-record.json?propertyAddress.${field}=${value}&min-transactionDate=${year}-01-01&max-transactionDate=${year}-12-31&_page=0&_pageSize=50`,
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

export async function getLandRegistryData(postcode, years) {
  const names = await getLandRegistryAreaNames(postcode);

  const locality = names?.result?.items[0]?.propertyAddress?.locality;
  const district = names?.result?.items[0]?.propertyAddress?.district;
  var data = {};

  const localityData = await fetchLandRegistryData("locality", locality, years);

  if (localityData.some((r) => r.result.items.length > 0)) {
    data = localityData;
  } else {
    data = await fetchLandRegistryData("district", district, years);
  }

  return { data, locality, district };
}
