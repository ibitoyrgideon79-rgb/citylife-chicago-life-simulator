import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputFile = path.join(__dirname, "chicago-loop.osm");

// Heart of Chicago Loop:
// State St & Adams St / Jackson / Dearborn / Clark / LaSalle
// ~400m x 400m core downtown
const bbox = "-87.6330,41.8765,-87.6255,41.8825";

async function fetchOSM() {
  if (fs.existsSync(outputFile)) {
    console.log("Cached OSM file exists:", outputFile);
    return;
  }

  console.log(`Fetching Chicago Loop OSM data from OpenStreetMap (bbox: ${bbox})...`);
  const url = `https://api.openstreetmap.org/api/0.6/map?bbox=${bbox}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "CityLife3D/1.0 (multiplayer-game)"
    }
  });

  if (!res.ok) {
    throw new Error(`OSM fetch failed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  fs.writeFileSync(outputFile, xml, "utf-8");
  console.log(`Saved ${xml.length} bytes to ${outputFile}`);
}

fetchOSM().catch(console.error);
