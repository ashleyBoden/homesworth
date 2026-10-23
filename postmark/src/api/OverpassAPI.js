import { straightLineDistance } from "../utils/distance";
import overpassSample from "../mockData/sampleOverpass.json";
import { overpassQuery } from "./queries/overpassQuery";
import { OVERPASS_SERVERS } from "../constants/overpassServers";
const inDev = import.meta.env.DEV;

async function fetchFromOverpass(query) {
  for (const server of OVERPASS_SERVERS) {
    try {
      const res = await fetch(server, {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(25000),
      });

      if (!res.ok) {
        throw new Error(`Server ${server} failed: trying fallback server...`);
      }

      console.log(`Server used: ${server}`);
      return await res.json();
    } catch (err) {
      console.error(`${err.message} - ${server}`);
    }
  }

  throw new Error("All Overpass servers failed. Please wait and retry...");
}

export async function OverpassAPI(latitude, longitude) {
  /*const overpassJson = await fetchFromOverpass(
    overpassQuery(latitude, longitude),
  );*/
  const overpassJson = !inDev
    ? await fetchFromOverpass(overpassQuery(latitude, longitude))
    : overpassSample;

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
