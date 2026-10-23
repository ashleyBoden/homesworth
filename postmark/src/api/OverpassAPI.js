import { straightLineDistance } from "../utils/distance";
import overpassSample from "../mockData/sampleOverpass.json";

const inDev = import.meta.env.DEV;

export async function OverpassAPI(latitude, longitude) {
  if (!inDev) {
    var overpassQuery = `
    [out:json][timeout:25];
    nwr["shop"="supermarket"](around:1000, ${latitude}, ${longitude})->.supermarkets;

    (
        nwr["leisure"="fitness_centre"](around:1000, ${latitude}, ${longitude});
        nwr["leisure"="sports_centre"](around:1000, ${latitude}, ${longitude});
    )->.gyms;

    nwr["amenity"="school"](around:1000, ${latitude}, ${longitude})->.schools;

    (
        nwr["railway"="station"](around:3000,${latitude},${longitude});
        nwr["railway"="halt"](around:3000,${latitude},${longitude});
        nwr["railway"="tram_stop"](around:3000,${latitude},${longitude});
    )->.transport;

    .supermarkets out tags center;
    .gyms out tags center;
    .schools out tags center;
    .transport out tags center;
    `;
    var overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: new URLSearchParams({ data: overpassQuery }),
    });

    if (!overpassRes.ok) {
      throw new Error("Overpass API call failed. Please retry.");
    }
  }

  const overpassJson = !inDev ? await overpassRes.json() : overpassSample;

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

  const trainData = overpassJson.elements
    .filter((el) => ["station", "halt"].includes(el.tags.railway))
    .map((el) => ({
      name: el.tags.name ?? "",
      type: el.tags.railway,
      lat: el.lat ?? el.center.lat,
      lon: el.lon ?? el.center.lon,
      distance: straightLineDistance(
        latitude,
        longitude,
        el.lat ?? el.center.lat,
        el.lon ?? el.center.lon,
      ),
    }));

  const tramData = overpassJson.elements
    .filter((el) => ["tram_stop"].includes(el.tags.railway))
    .map((el) => ({
      name: el.tags.name ?? "",
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
      ),
    }));

  return {
    supermarketData,
    gymData,
    schoolData,
    trainData,
    tramData,
  };
}
