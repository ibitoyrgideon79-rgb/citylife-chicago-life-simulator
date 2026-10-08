const endpoints = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter"
];

async function testFetch() {
  // Bounding box around Chicago Loop: State & Adams / Willis Tower / Michigan Ave
  // min_lat: 41.877, min_lon: -87.632, max_lat: 41.882, max_lon: -87.625
  const query = `
    [out:json][timeout:15];
    (
      way["building"](41.878,-87.632,41.881,-87.626);
    );
    out body geom;
  `;

  for (const ep of endpoints) {
    console.log("Trying:", ep);
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: {
          "User-Agent": "CityLife3D/1.0 (educational-game)",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "data=" + encodeURIComponent(query),
        signal: AbortSignal.timeout(8000)
      });
      console.log("Status:", res.status);
      if (res.ok) {
        const json = await res.json();
        console.log("Success! Found elements:", json.elements?.length);
        return json;
      }
    } catch (err) {
      console.log("Failed on", ep, ":", err.message);
    }
  }
}

testFetch();
