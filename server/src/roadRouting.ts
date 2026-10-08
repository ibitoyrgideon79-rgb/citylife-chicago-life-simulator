import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

export type RoadPoint = { x: number; z: number };
export type RoadRoute = { points: RoadPoint[]; distance: number };

type RoadSegment = {
  type: string;
  points: number[][];
};

type RoadEdge = {
  to: string;
  distance: number;
  cost: number;
};

type QueueEntry = {
  key: string;
  cost: number;
  priority: number;
};

type MetroIndex = {
  chunkSize: number;
  chunks: Array<{ id: string; files: { roads?: string } }>;
};

const CHUNK_SIZE = 2500;
const ROAD_CACHE_LIMIT = 48;
const MAX_SNAP_DISTANCE = 180;
const NON_DRIVABLE_TYPES = new Set([
  "bridleway",
  "cycleway",
  "footway",
  "path",
  "pedestrian",
  "steps",
]);
const ROAD_COST_FACTORS: Record<string, number> = {
  motorway: 0.9,
  motorway_link: 0.95,
  trunk: 0.92,
  trunk_link: 0.97,
  primary: 0.96,
  primary_link: 1,
  secondary: 1,
  secondary_link: 1.03,
  tertiary: 1.04,
  tertiary_link: 1.07,
  residential: 1.08,
  unclassified: 1.12,
  living_street: 1.2,
  service: 1.28,
  track: 1.4,
};

const indexPath = path.resolve(__dirname, "../../shared/chicago-metro-index.json");
const publicPath = path.resolve(__dirname, "../../client/public");
const index = fs.existsSync(indexPath)
  ? JSON.parse(fs.readFileSync(indexPath, "utf8")) as MetroIndex
  : null;
const chunks = new Map((index?.chunks ?? []).map((chunk) => [chunk.id, chunk.files]));
const roadCache = new Map<string, RoadSegment[]>();

class MinHeap {
  private readonly entries: QueueEntry[] = [];

  get size() {
    return this.entries.length;
  }

  push(entry: QueueEntry) {
    let index = this.entries.length;
    this.entries.push(entry);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.entries[parent].priority <= entry.priority) break;
      this.entries[index] = this.entries[parent];
      index = parent;
    }
    this.entries[index] = entry;
  }

  pop(): QueueEntry | undefined {
    const first = this.entries[0];
    const last = this.entries.pop();
    if (!first || !last) return first;
    if (this.entries.length === 0) return first;

    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.entries.length) break;
      const child = right < this.entries.length &&
        this.entries[right].priority < this.entries[left].priority ? right : left;
      if (this.entries[child].priority >= last.priority) break;
      this.entries[index] = this.entries[child];
      index = child;
    }
    this.entries[index] = last;
    return first;
  }
}

function pointKey(point: RoadPoint) {
  return `${Math.round(point.x * 10)},${Math.round(point.z * 10)}`;
}

function readRoadChunk(id: string): RoadSegment[] {
  const cached = roadCache.get(id);
  if (cached) {
    roadCache.delete(id);
    roadCache.set(id, cached);
    return cached;
  }

  const file = chunks.get(id)?.roads;
  if (!file) return [];
  const fullPath = path.resolve(publicPath, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Road data for map tile ${id} is missing.`);
  }

  const text = gunzipSync(fs.readFileSync(fullPath)).toString("utf8");
  const segments: RoadSegment[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const batch: unknown = JSON.parse(line);
    if (!Array.isArray(batch)) throw new Error(`Road data for map tile ${id} is invalid.`);
    for (const record of batch) {
      const road = record as RoadSegment;
      if (
        typeof road.type === "string" &&
        Array.isArray(road.points) &&
        road.points.length >= 2
      ) {
        segments.push(road);
      }
    }
  }

  roadCache.set(id, segments);
  if (roadCache.size > ROAD_CACHE_LIMIT) {
    const oldest = roadCache.keys().next().value as string | undefined;
    if (oldest) roadCache.delete(oldest);
  }
  return segments;
}

function nearestNode(point: RoadPoint, nodes: Map<string, RoadPoint>) {
  let closest: { key: string; distance: number } | undefined;
  for (const [key, candidate] of nodes) {
    const distance = Math.hypot(point.x - candidate.x, point.z - candidate.z);
    if (!closest || distance < closest.distance) closest = { key, distance };
  }
  return closest && closest.distance <= MAX_SNAP_DISTANCE ? closest : undefined;
}

function findRouteInGraph(
  start: RoadPoint,
  end: RoadPoint,
  graph: Map<string, RoadEdge[]>,
  nodes: Map<string, RoadPoint>,
): RoadRoute | null {
  const startNode = nearestNode(start, nodes);
  const endNode = nearestNode(end, nodes);
  if (!startNode || !endNode) return null;
  if (startNode.key === endNode.key) {
    return { points: [nodes.get(startNode.key)!], distance: 0 };
  }

  const costs = new Map<string, number>([[startNode.key, 0]]);
  const previous = new Map<string, string>();
  const queue = new MinHeap();
  const target = nodes.get(endNode.key)!;
  const heuristic = (key: string) => {
    const point = nodes.get(key)!;
    return Math.hypot(point.x - target.x, point.z - target.z) * 0.9;
  };
  queue.push({ key: startNode.key, cost: 0, priority: heuristic(startNode.key) });

  while (queue.size > 0) {
    const current = queue.pop()!;
    if (current.cost > (costs.get(current.key) ?? Infinity)) continue;
    if (current.key === endNode.key) break;

    for (const edge of graph.get(current.key) ?? []) {
      const nextCost = current.cost + edge.cost;
      if (nextCost >= (costs.get(edge.to) ?? Infinity)) continue;
      costs.set(edge.to, nextCost);
      previous.set(edge.to, current.key);
      queue.push({
        key: edge.to,
        cost: nextCost,
        priority: nextCost + heuristic(edge.to),
      });
    }
  }

  if (!costs.has(endNode.key)) return null;
  const keys = [endNode.key];
  let currentKey = endNode.key;
  while (currentKey !== startNode.key) {
    const parent = previous.get(currentKey);
    if (!parent) return null;
    keys.push(parent);
    currentKey = parent;
  }
  keys.reverse();

  const points = keys.map((key) => nodes.get(key)!);
  let distance = 0;
  for (let index = 1; index < points.length; index += 1) {
    distance += Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].z - points[index - 1].z,
    );
  }
  return { points, distance };
}

export function findRoadRoute(start: RoadPoint, end: RoadPoint): RoadRoute | null {
  if (!index || index.chunkSize !== CHUNK_SIZE) {
    throw new Error("The Greater Chicago road index is unavailable.");
  }

  const margin = CHUNK_SIZE;
  const minChunkX = Math.floor((Math.min(start.x, end.x) - margin) / CHUNK_SIZE);
  const maxChunkX = Math.floor((Math.max(start.x, end.x) + margin) / CHUNK_SIZE);
  const minChunkZ = Math.floor((Math.min(start.z, end.z) - margin) / CHUNK_SIZE);
  const maxChunkZ = Math.floor((Math.max(start.z, end.z) + margin) / CHUNK_SIZE);
  const graph = new Map<string, RoadEdge[]>();
  const nodes = new Map<string, RoadPoint>();

  for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX += 1) {
    for (let chunkZ = minChunkZ; chunkZ <= maxChunkZ; chunkZ += 1) {
      const id = `${chunkX}_${chunkZ}`;
      for (const road of readRoadChunk(id)) {
        if (NON_DRIVABLE_TYPES.has(road.type)) continue;
        const factor = ROAD_COST_FACTORS[road.type] ?? 1.15;
        for (let index = 1; index < road.points.length; index += 1) {
          const rawA = road.points[index - 1];
          const rawB = road.points[index];
          if (
            !Number.isFinite(rawA[0]) || !Number.isFinite(rawA[1]) ||
            !Number.isFinite(rawB[0]) || !Number.isFinite(rawB[1])
          ) continue;
          const a = { x: rawA[0], z: rawA[1] };
          const b = { x: rawB[0], z: rawB[1] };
          const from = pointKey(a);
          const to = pointKey(b);
          const distance = Math.hypot(b.x - a.x, b.z - a.z);
          if (distance < 0.1) continue;
          nodes.set(from, a);
          nodes.set(to, b);
          const forward = graph.get(from) ?? [];
          forward.push({ to, distance, cost: distance * factor });
          graph.set(from, forward);
          const reverse = graph.get(to) ?? [];
          reverse.push({ to: from, distance, cost: distance * factor });
          graph.set(to, reverse);
        }
      }
    }
  }

  return findRouteInGraph(start, end, graph, nodes);
}
