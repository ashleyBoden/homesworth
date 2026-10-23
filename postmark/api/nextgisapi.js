export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const key = process.env.NEXTGIS_KEY;

    if (!key) {
      return new Response("Server not configured", { status: 500 });
    }

    const body = await request.text();

    try {
      const res = await fetch(
        `https://overpass.nextgis.com/${key}/api/interpreter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
          signal: AbortSignal.timeout(15000),
        },
      );

      return new Response(await res.text(), {
        status: res.status,
        headers: { "content-type": "application/json" },
      });
    } catch (err) {
      console.error(`NextGIS API call failed: ${err.message}`);
      if (err.name === "TimeoutError") {
        return new Response("NextGIS failed: Timed out", { status: 504 });
      }
      return new Response("NextGIS failed: Bad Gateway", { status: 502 });
    }
  },
};
