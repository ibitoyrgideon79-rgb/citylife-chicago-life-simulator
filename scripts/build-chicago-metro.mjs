import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { gzipSync } from "node:zlib";
import parseOSM from "osm-pbf-parser";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceFiles = [
  "chicago-illinois-20261006.osm.pbf",
  "chicago-indiana-20261006.osm.pbf",
  "chicago-wisconsin-20261006.osm.pbf",
].map((file) => path.join(root, "scripts", file));
const chunkDirectory = path.join(root, "client", "public", "chicago-metro-chunks");
const sharedDirectory = path.join(root, "shared");
const clientDirectory = path.join(root, "client", "public");
const collisionPath = path.join(sharedDirectory, "chicago-metro-collision.json");

const CENTER = { lat: 41.8795, lon: -87.62925 };
const CHUNK_SIZE = 2500;
const METERS_PER_LAT = 111030;
const METERS_PER_LON = METERS_PER_LAT * Math.cos((CENTER.lat * Math.PI) / 180);
const BOUNDS = { minX: -90000, maxX: 75000, minZ: -85000, maxZ: 100000 };
const MAJOR_ROADS = new Set(["motorway", "trunk", "primary", "secondary"]);
const MAP_LICENSE = "© OpenStreetMap contributors, ODbL 1.0";

for (const sourceFile of sourceFiles) {
  if (!fs.existsSync(sourceFile) || fs.statSync(sourceFile).size === 0) {
    throw new Error(`Missing or empty regional OSM extract: ${sourceFile}`);
  }
}

fs.mkdirSync(sharedDirectory, { recursive: true });
fs.mkdirSync(clientDirectory, { recursive: true });
fs.rmSync(chunkDirectory, { recursive: true, force: true });
fs.mkdirSync(chunkDirectory, { recursive: true });
fs.writeFileSync(collisionPath, "[");

let nodeIds = new Float64Array(0);
let nodeXs = new Int32Array(0);
let nodeZs = new Int32Array(0);
let nodeCount = 0;
const chunks = new Map();
const dirtyChunks = new Set();
const overviewRoads = [];
const landmarks = [];
let districtNames = [];
let overviewRoadCounter = 0;
let collisionCount = 0;
let collisionBatch = [];

function toGameCoord(lat, lon) {
  return {
    x: Math.round((lon - CENTER.lon) * METERS_PER_LON * 10) / 10,
    z: Math.round(-(lat - CENTER.lat) * METERS_PER_LAT * 10) / 10,
  };
}

function isInBounds(point) {
  return point.x >= BOUNDS.minX && point.x <= BOUNDS.maxX &&
    point.z >= BOUNDS.minZ && point.z <= BOUNDS.maxZ;
}

function getChunk(x, z) {
  const cx = Math.floor(x / CHUNK_SIZE);
  const cz = Math.floor(z / CHUNK_SIZE);
  const id = `${cx}_${cz}`;
  let chunk = chunks.get(id);
  if (!chunk) {
    chunk = {
      id,
      cx,
      cz,
      buildings: [],
      roads: [],
      trafficRoutes: [],
      parkedCars: [],
      writers: {},
    };
    chunks.set(id, chunk);
  }
  return chunk;
}

function markChunkDirty(chunk) {
  dirtyChunks.add(chunk.id);
}

function flushChunkBuffers() {
  for (const id of dirtyChunks) {
    const chunk = chunks.get(id);
    if (!chunk) continue;
    for (const key of ["buildings", "roads", "trafficRoutes", "parkedCars"]) {
      const records = chunk[key];
      if (records.length === 0) continue;
      const writer = chunk.writers[key] ?? { hasRecords: false };
      const filename = path.join(chunkDirectory, `${chunk.id}.${key}.jsonl.gz`);
      const fd = fs.openSync(filename, writer.hasRecords ? "a" : "w");
      fs.writeSync(fd, gzipSync(`${JSON.stringify(records)}\n`));
      fs.closeSync(fd);
      writer.hasRecords = true;
      chunk.writers[key] = writer;
      records.length = 0;
    }
  }
  dirtyChunks.clear();
}

function addNode(id, point) {
  if (nodeCount === nodeIds.length) {
    const capacity = Math.max(65536, nodeIds.length * 2);
    const ids = new Float64Array(capacity);
    const xs = new Int32Array(capacity);
    const zs = new Int32Array(capacity);
    ids.set(nodeIds);
    xs.set(nodeXs);
    zs.set(nodeZs);
    nodeIds = ids;
    nodeXs = xs;
    nodeZs = zs;
  }
  nodeIds[nodeCount] = Number(id);
  nodeXs[nodeCount] = Math.round(point.x * 10);
  nodeZs[nodeCount] = Math.round(point.z * 10);
  nodeCount += 1;
}

function findNode(id) {
  const target = Number(id);
  let low = 0;
  let high = nodeCount - 1;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    const candidate = nodeIds[middle];
    if (candidate === target) return { x: nodeXs[middle] / 10, z: nodeZs[middle] / 10 };
    if (candidate < target) low = middle + 1;
    else high = middle - 1;
  }
  return undefined;
}

function inferredHeight(tags, x, z) {
  const taggedHeight = Number.parseFloat(tags.height);
  if (Number.isFinite(taggedHeight) && taggedHeight > 0) return Math.max(3, taggedHeight);
  const levels = Number.parseFloat(tags["building:levels"]);
  if (Number.isFinite(levels) && levels > 0) return Math.max(3, levels * 3.4);
  const kind = tags.building;
  if (["house", "detached", "semidetached_house", "residential", "garage"].includes(kind)) return 8.5;
  if (["commercial", "office", "retail", "apartments", "hotel", "hospital"].includes(kind)) {
    if (Math.hypot(x, z) < 3000) {
      const hash = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
      return 28 + hash * 65;
    }
    return 15;
  }
  return 10;
}

function addBuilding(way, points) {
  if (points.length < 3) return;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
  }
  const x = Math.round(((minX + maxX) / 2) * 10) / 10;
  const z = Math.round(((minZ + maxZ) / 2) * 10) / 10;
  if (!isInBounds({ x, z })) return;

  const w = Math.max(4, Math.round((maxX - minX) * 10) / 10);
  const d = Math.max(4, Math.round((maxZ - minZ) * 10) / 10);
  const h = Math.round(inferredHeight(way.tags, x, z) * 10) / 10;
  const building = {
    id: String(way.id), name: way.tags.name, x, z, w, d, h,
    footprint: points.map((point) => [point.x, point.z]),
    minX: Math.round((x - w / 2) * 10) / 10,
    maxX: Math.round((x + w / 2) * 10) / 10,
    minZ: Math.round((z - d / 2) * 10) / 10,
    maxZ: Math.round((z + d / 2) * 10) / 10,
  };
  const chunk = getChunk(x, z);
  chunk.buildings.push(building);
  markChunkDirty(chunk);
  collisionBatch.push([building.minX, building.maxX, building.minZ, building.maxZ]);
  if (way.tags.name && landmarks.length < 5000) {
    landmarks.push({ name: way.tags.name, x, z, height: h });
  }
}

function addRoad(way, points) {
  const type = way.tags.highway;
  if (!type || points.length < 2) return;
  const width = type === "motorway" || type === "trunk" ? 24 :
    MAJOR_ROADS.has(type) ? 18 :
      type === "service" || type === "footway" || type === "path" ? 5 : 11;

  const routePieces = new Map();
  let parkedDistance = 0;
  let carIndex = 0;
  const parkSpacing = type === "residential" ? 180 : type === "tertiary" ? 145 : 220;
  const canPark = ["residential", "unclassified", "tertiary", "secondary", "service"].includes(type);

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (!isInBounds(a) || !isInBounds(b)) continue;
    const segmentLength = Math.hypot(b.x - a.x, b.z - a.z);
    const segment = {
      id: `${way.id}_${i}`,
      name: way.tags.name,
      type,
      width,
      points: [[a.x, a.z], [b.x, b.z]],
    };
    const chunk = getChunk((a.x + b.x) / 2, (a.z + b.z) / 2);
    chunk.roads.push(segment);
    markChunkDirty(chunk);
    const pieces = routePieces.get(chunk.id) ?? [];
    let piece = pieces.at(-1);
    if (!piece || piece.points.at(-1)?.[0] !== a.x || piece.points.at(-1)?.[1] !== a.z) {
      piece = { id: `${way.id}_${pieces.length}`, type, points: [[a.x, a.z]] };
      pieces.push(piece);
      routePieces.set(chunk.id, pieces);
    }
    piece.points.push([b.x, b.z]);
    overviewRoadCounter += 1;
    if (
      overviewRoads.length < 10000 &&
      (["motorway", "trunk", "primary"].includes(type) || overviewRoadCounter % 200 === 0)
    ) overviewRoads.push(segment);

    if (canPark) {
      parkedDistance += segmentLength;
      if (parkedDistance >= parkSpacing) {
        parkedDistance %= parkSpacing;
        carIndex += 1;
        const hash = Math.abs(Math.sin(Number(way.id) * 0.0001 + carIndex * 91.7) * 43758.5453) % 1;
        if (hash < 0.42) {
          const side = hash > 0.21 ? 1 : -1;
          const length = Math.max(0.1, segmentLength);
          const offsetX = (-(b.z - a.z) / length) * side * (width / 2 + 2);
          const offsetZ = ((b.x - a.x) / length) * side * (width / 2 + 2);
          const x = Math.round(((a.x + b.x) / 2 + offsetX) * 10) / 10;
          const z = Math.round(((a.z + b.z) / 2 + offsetZ) * 10) / 10;
          if (isInBounds({ x, z }) && chunk.parkedCars.length < 100) {
            const urban = Math.hypot(x, z);
            const model = urban < 5000 && hash < 0.10 ? "sports" :
              urban > 20000 && hash < 0.22 ? "pickup" :
                hash < 0.3 ? "suv" : "sedan";
            const colors = model === "sports"
              ? ["#6f1715", "#333840", "#8d783d"]
              : model === "pickup"
                ? ["#6c6255", "#3c4543", "#8e8b80"]
                : ["#777b7a", "#9b9b94", "#383d3e", "#77706a", "#3d5365"];
            chunk.parkedCars.push({
              id: `${way.id}_park_${carIndex}`,
              x,
              z,
              rot: Math.atan2(-(b.x - a.x), -(b.z - a.z)),
              model,
              class: model === "sports" ? "luxury" : model === "pickup" ? "work" : urban > 25000 ? "economy" : "standard",
              color: colors[Math.floor(hash * 1000) % colors.length],
            });
            markChunkDirty(chunk);
          }
        }
      }
    }
  }

  for (const [chunkId, pieces] of routePieces) {
    const numericId = Number(way.id);
    if (!Number.isFinite(numericId) || numericId % 7 !== 0) continue;
    const chunk = chunks.get(chunkId);
    if (chunk && chunk.trafficRoutes.length < 200) {
      chunk.trafficRoutes.push(...pieces.filter((piece) => piece.points.length >= 2).slice(0, 200 - chunk.trafficRoutes.length));
      markChunkDirty(chunk);
    }
  }
}

async function readExtract(filename) {
  console.log(`Reading ${path.basename(filename)}…`);
  const parser = parseOSM();
  let buffer = [];
  let processedRows = 0;
  const flush = () => {
    if (buffer.length === 0) return;
    const items = buffer;
    buffer = [];
    for (const item of items) {
      if (item.type === "node") {
        const point = toGameCoord(item.lat, item.lon);
        if (
          point.x >= BOUNDS.minX - 10000 && point.x <= BOUNDS.maxX + 10000 &&
          point.z >= BOUNDS.minZ - 10000 && point.z <= BOUNDS.maxZ + 10000
        ) addNode(item.id, point);
        if (item.tags?.place && item.tags?.name && isInBounds(point)) {
          districtNames.push({ name: item.tags.name, type: item.tags.place, ...point });
        }
        continue;
      }
      if (item.type !== "way") continue;
      const tags = item.tags ?? {};
      if (!tags.building && !tags.highway) continue;
      const points = item.refs.map(findNode).filter((point) => point !== undefined);
      if (!points.some(isInBounds)) continue;
      if (tags.building) addBuilding(item, points);
      if (tags.highway) addRoad(item, points);
    }
    if (collisionBatch.length > 0) {
      const prefix = collisionCount > 0 ? "," : "";
      fs.appendFileSync(collisionPath, prefix + JSON.stringify(collisionBatch).slice(1, -1));
      collisionCount += collisionBatch.length;
      collisionBatch = [];
    }
    flushChunkBuffers();
    processedRows += items.length;
    if (processedRows >= 100000) {
      console.log(`Processed ${processedRows.toLocaleString()} OSM elements, ${nodeCount.toLocaleString()} local nodes…`);
      processedRows = 0;
    }
  };

  await pipeline(
    fs.createReadStream(filename),
    parser,
    new Writable({
      objectMode: true,
      write(items, _encoding, callback) {
        try {
          buffer.push(...(Array.isArray(items) ? items : [items]));
          if (buffer.length >= 5000) flush();
          callback();
        } catch (error) {
          callback(error);
        }
      },
    }),
  );
  flush();
  nodeCount = 0;
}

for (const sourceFile of sourceFiles) await readExtract(sourceFile);
fs.appendFileSync(collisionPath, "]");

const chunkIndex = [];
for (const chunk of chunks.values()) {
  const files = {};
  for (const key of ["buildings", "roads", "trafficRoutes", "parkedCars"]) {
    if (chunk.writers[key]) files[key] = `chicago-metro-chunks/${chunk.id}.${key}.jsonl.gz`;
  }
  chunkIndex.push({
    id: chunk.id,
    files,
    minX: chunk.cx * CHUNK_SIZE,
    maxX: (chunk.cx + 1) * CHUNK_SIZE,
    minZ: chunk.cz * CHUNK_SIZE,
    maxZ: (chunk.cz + 1) * CHUNK_SIZE,
  });
}

chunkIndex.sort((a, b) => a.id.localeCompare(b.id));
const index = {
  name: "Chicago Metropolitan Area",
  source: MAP_LICENSE,
  districts: districtNames,
  center: { ...CENTER, label: "State & Adams / Federal Plaza" },
  bounds: BOUNDS,
  chunkSize: CHUNK_SIZE,
  chunks: chunkIndex,
};
fs.writeFileSync(path.join(sharedDirectory, "chicago-metro-index.json"), JSON.stringify(index));
fs.writeFileSync(path.join(clientDirectory, "chicago-metro-index.json"), JSON.stringify(index));
fs.writeFileSync(
  path.join(clientDirectory, "chicago-metro-overview.json"),
  JSON.stringify({ bounds: BOUNDS, roads: overviewRoads, landmarks, source: MAP_LICENSE }),
);
console.log(`Generated ${chunkIndex.length} chunks, ${collisionCount} building collision bounds, and ${overviewRoads.length} major-road segments.`);
