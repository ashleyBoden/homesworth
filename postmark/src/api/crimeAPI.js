export async function getCrimeData(latitude, longitude) {
  const crimeRes = await fetch(
    `https://data.police.uk/api/crimes-street/all-crime?lat=${latitude}&lng=${longitude}`
  );
  const crimeData = await crimeRes.json();
  
  if (!crimeRes.ok) {
    throw new Error("Failed to retrieve crime data. Please try again.");
  }

  return crimeData
}