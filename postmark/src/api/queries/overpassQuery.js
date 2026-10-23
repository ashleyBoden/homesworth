export function overpassQuery(latitude, longitude) {
  const query = `
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

  return query;
}
