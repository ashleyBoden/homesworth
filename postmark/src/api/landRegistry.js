async function fetchLandRegistryData(field, value, years) {
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

export async function getLandRegistryData(locality, town, years) {
  const localityData = await fetchLandRegistryData("locality", locality, years);

  if (localityData.some((r) => r.result.items.length > 0)) {
    return localityData;
  }

  return await fetchLandRegistryData("town", town, years);
}
