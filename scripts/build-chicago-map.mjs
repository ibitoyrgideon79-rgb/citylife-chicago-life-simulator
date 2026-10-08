import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const osmFile = path.join(__dirname, "chicago-loop.osm");
const sharedJson = path.join(__dirname, "../shared/chicago-loop.json");
const publicJson = path.join(__dirname, "../client/public/chicago-loop.json");

console.log("Reading OSM file...");
const xml = fs.readFileSync(osmFile, "utf-8");

// 1. Parse Nodes
console.log("Parsing nodes...");
const nodes = new Map();
const nodeTagRegex = /<node\s+([^>]+)>/g;
let m;
while ((m = nodeTagRegex.exec(xml)) !== null) {
  const attrs = m[1];
  const idMatch = attrs.match(/id="(\d+)"/);
  const latMatch = attrs.match(/lat="([^"]+)"/);
  const lonMatch = attrs.match(/lon="([^"]+)"/);
  if (idMatch && latMatch && lonMatch) {
    nodes.set(idMatch[1], {
      lat: parseFloat(latMatch[1]),
      lon: parseFloat(lonMatch[1])
    });
  }
}
console.log(`Parsed ${nodes.size} nodes.`);

// Geographic center (Adams St & Dearborn / Federal Center Plaza)
const LAT_0 = 41.8795;
const LON_0 = -87.62925;
const METERS_PER_LAT = 111030;
const METERS_PER_LON = 111030 * Math.cos(LAT_0 * Math.PI / 180);

// 1 GAME UNIT = 1 REAL METER! (Authentic 1:1 real-world physical scale)
const SCALE = 1.0;

function toGameCoord(lat, lon) {
  const xMeters = (lon - LON_0) * METERS_PER_LON;
  const zMeters = -(lat - LAT_0) * METERS_PER_LAT;
  return {
    x: Math.round(xMeters * SCALE * 10) / 10,
    z: Math.round(zMeters * SCALE * 10) / 10
  };
}

// 2. Parse Ways
console.log("Parsing ways...");
const wayBlocks = xml.split("</way>");

const buildings = [];
const roads = [];
const landmarks = [];

for (const block of wayBlocks) {
  if (!block.includes("<way")) continue;

  const idMatch = block.match(/<way\s+[^>]*id="(\d+)"/);
  if (!idMatch) continue;
  const wayId = idMatch[1];

  const tags = {};
  const tagMatches = block.matchAll(/<tag\s+k="([^"]+)"\s+v="([^"]+)"/g);
  for (const tm of tagMatches) {
    tags[tm[1]] = tm[2];
  }

  const ndRefs = [];
  const ndMatches = block.matchAll(/<nd\s+ref="(\d+)"/g);
  for (const nm of ndMatches) {
    const pt = nodes.get(nm[1]);
    if (pt) {
      ndRefs.push(toGameCoord(pt.lat, pt.lon));
    }
  }

  if (ndRefs.length < 2) continue;

  // Process Buildings
  if (tags.building && ndRefs.length >= 3) {
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let sumX = 0, sumZ = 0;

    for (const pt of ndRefs) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.z < minZ) minZ = pt.z;
      if (pt.z > maxZ) maxZ = pt.z;
      sumX += pt.x;
      sumZ += pt.z;
    }

    const count = ndRefs.length;
    const centerX = Math.round((sumX / count) * 10) / 10;
    const centerZ = Math.round((sumZ / count) * 10) / 10;
    const width = Math.max(12, Math.round((maxX - minX) * 10) / 10);
    const depth = Math.max(12, Math.round((maxZ - minZ) * 10) / 10);

    // Keep within play area bounds (±240 meters)
    if (Math.abs(centerX) > 240 || Math.abs(centerZ) > 240) continue;

    // Real skyscraper height in meters
    let height = 38; // ~10-story building default
    if (tags.height) {
      const hParsed = parseFloat(tags.height);
      if (!isNaN(hParsed)) height = Math.max(18, hParsed);
    } else if (tags["building:levels"]) {
      const lvls = parseFloat(tags["building:levels"]);
      if (!isNaN(lvls)) height = Math.max(18, lvls * 3.8);
    } else {
      // Realistic Chicago skyscraper height (30m to 110m)
      const distFromCenter = Math.hypot(centerX, centerZ);
      const hBonus = Math.max(5, 75 - distFromCenter * 0.25);
      const hash = ((Math.abs(Math.sin(centerX * 12.9898 + centerZ * 78.233)) * 43758.5453) % 1);
      height = 24 + Math.round((hBonus * 0.7 + hash * 50) * 10) / 10;
    }

    const name = tags.name || tags["building:name"] || tags["addr:housename"];

    // Bounding box for server collision
    const bHalfW = width * 0.5;
    const bHalfD = depth * 0.5;

    buildings.push({
      id: wayId,
      name: name || undefined,
      x: centerX,
      z: centerZ,
      w: width,
      d: depth,
      h: Math.round(height * 10) / 10,
      // AABB for fast collision
      minX: Math.round((centerX - bHalfW) * 10) / 10,
      maxX: Math.round((centerX + bHalfW) * 10) / 10,
      minZ: Math.round((centerZ - bHalfD) * 10) / 10,
      maxZ: Math.round((centerZ + bHalfD) * 10) / 10,
    });

    if (name) {
      landmarks.push({
        name,
        x: centerX,
        z: centerZ,
        height: Math.round(height * 10) / 10
      });
    }
  }

  // Process Roads
  if (tags.highway) {
    const inBounds = ndRefs.some(p => Math.abs(p.x) <= 240 && Math.abs(p.z) <= 240);
    if (!inBounds) continue;

    const isMajor = ["primary", "secondary", "tertiary", "trunk"].includes(tags.highway);
    const isService = tags.highway === "service" || tags.highway === "footway";
    // Real street widths in meters (14m for 2-lane avenues, 20m for major Chicago boulevards)
    const width = isMajor ? 18.0 : isService ? 8.0 : 13.0;

    roads.push({
      id: wayId,
      name: tags.name,
      type: tags.highway,
      width,
      points: ndRefs.map(p => [p.x, p.z])
    });
  }
}

console.log(`Generated:
- Buildings: ${buildings.length}
- Landmarks: ${landmarks.length}
- Roads: ${roads.length}
`);

landmarks.sort((a, b) => b.height - a.height);
const topLandmarks = landmarks.slice(0, 15);

const cityData = {
  name: "Chicago Loop",
  scale: "1 unit = 1 meter",
  center: { lat: LAT_0, lon: LON_0, label: "State & Adams / Federal Plaza" },
  bounds: { minX: -240, maxX: 240, minZ: -240, maxZ: 240 },
  buildings,
  roads,
  landmarks: topLandmarks
};

const jsonStr = JSON.stringify(cityData);
fs.writeFileSync(sharedJson, jsonStr, "utf-8");
fs.writeFileSync(publicJson, jsonStr, "utf-8");
console.log(`Wrote ${sharedJson} and ${publicJson} (${(jsonStr.length / 1024).toFixed(1)} KB)`);
