import { straightLineDistance } from "../utils/distance";

export async function OverpassAPI(postcode) {
  const res = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
  const { result } = await res.json();
  const { latitude, longitude } = result;

  var overpassQuery = `
    [out:json][timeout:25];
    nwr["shop"="supermarket"](around:1000, ${latitude}, ${longitude})->.supermarkets;

    (
        nwr["leisure"="fitness_centre"](around:1000, ${latitude}, ${longitude});
        nwr["leisure"="sports_centre"](around:1000, ${latitude}, ${longitude});
    )->.gyms;

    nwr["amenity"="school"](around:1000, ${latitude}, ${longitude})->.schools;

    .supermarkets out count;
    .gyms out count;
    .schools out count;

    .supermarkets out tags center;
    .gyms out tags center;
    .schools out tags center;
    `;
  var overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: new URLSearchParams({ data: overpassQuery }),
  });

  const overpassJson = await overpassRes.json();
  console.log(overpassJson);

  let supermarketCount = overpassJson.elements[0].tags.total;
  let gymCount = overpassJson.elements[1].tags.total;
  let schoolCount = overpassJson.elements[2].tags.total;

  const supermarketData = overpassJson.elements
    .filter((el) => el.tags.shop === "supermarket")
    .map((el) => ({
      name: el.tags.name ?? el.tags.brand ?? "",
      lat: el.lat ?? el.center.lat,
      lon: el.lon ?? el.center.lon,
      distance: straightLineDistance(
        latitude,
        longitude,
        el.lat ?? el.center.lat,
        el.lon ?? el.center.lon,
      ),
    }));

  const gymData = overpassJson.elements
    .filter((el) =>
      ["fitness_centre", "sports_centre"].includes(el.tags.leisure),
    )
    .map((el) => ({
      name: el.tags.name ?? el.tags.brand ?? "",
      lat: el.lat ?? el.center.lat,
      lon: el.lon ?? el.center.lon,
      distance: straightLineDistance(
        latitude,
        longitude,
        el.lat ?? el.center.lat,
        el.lon ?? el.center.lon,
      ),
    }));

  const schoolData = overpassJson.elements
    .filter((el) => el.tags.amenity === "school")
    .map((el) => ({
      name: el.tags.name ?? el.tags["addr:housename"],
      type: el.tags.school ?? "",
      lat: el.lat ?? el.center.lat,
      lon: el.lon ?? el.center.lon,
      distance: straightLineDistance(
        latitude,
        longitude,
        el.lat ?? el.center.lat,
        el.lon ?? el.center.lon,
      )
    }));

  return {
    gymCount,
    supermarketCount,
    schoolCount,
    supermarketData,
    gymData,
    schoolData,
  };
}
