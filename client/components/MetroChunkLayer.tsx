"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Net } from "../types/network";
import { getSkyscraperTexture } from "../utils/cityTextures";

type Building = {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  footprint?: number[][];
};

type Road = {
  id: string;
  width: number;
  points: number[][];
};

type Car = {
  id: string;
  x: number;
  z: number;
  rot: number;
  model: string;
  class: string;
  color: string;
};

type TrafficRoute = {
  id: string;
  points: number[][];
};

type AmbientCar = Car & { points?: number[][] };

type ChunkData = {
  id: string;
  buildings: Building[];
  roads: Road[];
  parkedCars: Car[];
  trafficRoutes: TrafficRoute[];
};

const pendingChunkLoads = new Map<string, Promise<ChunkData>>();

type ChunkIndex = {
  chunkSize: number;
  chunks: Array<{
    id: string;
    files: Partial<Record<"buildings" | "roads" | "trafficRoutes" | "parkedCars", string>>;
  }>;
};

const CHUNK_RADIUS = 1;
const FACADE_COLORS = ["#d2c7b4", "#929897", "#b7a493", "#747876", "#c6c2b8", "#81796f"];
const trafficPositions = new Map<string, { x: number; z: number; parked: boolean }>();

async function fetchWithRetry(url: string, signal?: AbortSignal) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, signal ? { signal } : undefined);
      if (response.ok || response.status < 500 || attempt === 2) return response;
      lastError = new Error(`Request failed (${response.status}).`);
    } catch (reason) {
      if (signal?.aborted) throw reason;
      lastError = reason;
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error("Map request failed.");
}

function createChunkGeometry(data: ChunkData) {
  const buildingGroups: THREE.BufferGeometry[][] = Array.from({ length: FACADE_COLORS.length }, () => []);
  const roadGeometries: THREE.BufferGeometry[] = [];

  for (const building of data.buildings) {
    const styleHash = [...building.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const groupIndex = styleHash % buildingGroups.length;
    let geometry: THREE.BufferGeometry;
    const footprint = building.footprint?.filter((point) =>
      Number.isFinite(point[0]) && Number.isFinite(point[1]),
    );
    if (footprint && footprint.length >= 4) {
      const points = footprint.slice();
      if (points[0][0] === points.at(-1)?.[0] && points[0][1] === points.at(-1)?.[1]) points.pop();
      const shape = new THREE.Shape();
      shape.moveTo(points[0][0] - building.x, -(points[0][1] - building.z));
      for (const point of points.slice(1)) shape.lineTo(point[0] - building.x, -(point[1] - building.z));
      shape.closePath();
      geometry = new THREE.ExtrudeGeometry(shape, { depth: building.h, bevelEnabled: false });
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(building.x, 0, building.z);
    } else if (building.h > 50 && [1, 3, 5].includes(groupIndex)) {
      const lowerHeight = building.h * 0.78;
      const upperHeight = building.h - lowerHeight;
      const lower = new THREE.BoxGeometry(building.w, lowerHeight, building.d);
      lower.translate(building.x, lowerHeight / 2, building.z);
      const upper = new THREE.BoxGeometry(building.w * (groupIndex === 3 ? 0.62 : 0.76), upperHeight, building.d * 0.76);
      upper.translate(building.x, lowerHeight + upperHeight / 2, building.z);
      buildingGroups[groupIndex].push(lower, upper);
      continue;
    } else {
      geometry = new THREE.BoxGeometry(building.w, building.h, building.d);
      geometry.translate(building.x, building.h / 2, building.z);
    }
    buildingGroups[groupIndex].push(geometry);
  }

  for (const road of data.roads) {
    for (let i = 0; i < road.points.length - 1; i += 1) {
      const [x1, z1] = road.points[i];
      const [x2, z2] = road.points[i + 1];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      if (length < 0.5) continue;
      const halfWidth = road.width / 2;
      const nx = (-dz / length) * halfWidth;
      const nz = (dx / length) * halfWidth;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([
          x1 - nx, 0.24, z1 - nz, x1 + nx, 0.24, z1 + nz, x2 - nx, 0.24, z2 - nz,
          x2 - nx, 0.24, z2 - nz, x1 + nx, 0.24, z1 + nz, x2 + nx, 0.24, z2 + nz,
        ], 3),
      );
      geometry.computeVertexNormals();
      roadGeometries.push(geometry);
    }
  }

  const buildings = buildingGroups.map((group) =>
    group.length ? BufferGeometryUtils.mergeGeometries(group, false) : null,
  );
  const roads = roadGeometries.length
    ? BufferGeometryUtils.mergeGeometries(roadGeometries, false)
    : null;
  [...buildingGroups.flat(), ...roadGeometries].forEach((geometry) => geometry.dispose());
  return { buildings, roads };
}

function VehicleMesh({ car, moving, seed }: { car: AmbientCar; moving: boolean; seed: number }) {
  const ref = React.useRef<THREE.Group>(null);
  const distanceRef = React.useRef<number | null>(null);
  const [routes] = useState(() => {
    const points = car.points ?? [];
    return points.slice(1).map((point, index) => {
      const start = points[index];
      return { start, end: point, length: Math.hypot(point[0] - start[0], point[1] - start[1]) };
    });
  });

  React.useEffect(() => {
    trafficPositions.set(car.id, { x: car.x, z: car.z, parked: !moving });
    return () => { trafficPositions.delete(car.id); };
  }, [car.id, car.x, car.z, moving]);

  useFrame((_, delta) => {
    if (!moving || !ref.current || routes.length === 0) return;
    const totalLength = routes.reduce((sum, segment) => sum + segment.length, 0);
    if (totalLength <= 0) return;
    if (distanceRef.current === null) distanceRef.current = seed % totalLength;
    const nextDistance = (distanceRef.current + delta * 7) % totalLength;
    let distance = nextDistance;
    let nextPosition: { x: number; z: number; rot: number } | null = null;
    for (const segment of routes) {
      if (distance <= segment.length) {
        const t = distance / segment.length;
        const dx = segment.end[0] - segment.start[0];
        const dz = segment.end[1] - segment.start[1];
        nextPosition = {
          x: segment.start[0] + dx * t,
          z: segment.start[1] + dz * t,
          rot: Math.atan2(-dx, -dz),
        };
        break;
      }
      distance -= segment.length;
    }
    if (!nextPosition) return;
    const blocked = [...trafficPositions.entries()].some(([id, other]) =>
      id !== car.id && Math.hypot(nextPosition!.x - other.x, nextPosition!.z - other.z) < (other.parked ? 5 : 4.6),
    );
    if (blocked) return;
    distanceRef.current = nextDistance;
    ref.current.position.set(nextPosition.x, 0.24, nextPosition.z);
    ref.current.rotation.y = nextPosition.rot;
    trafficPositions.set(car.id, { x: nextPosition.x, z: nextPosition.z, parked: false });
  });

  const length = car.model === "sports" ? 4.3 : car.model === "pickup" || car.model === "suv" ? 5.0 : 4.6;
  const width = car.model === "sports" ? 1.85 : car.model === "pickup" || car.model === "suv" ? 2.0 : 1.9;
  return (
    <group ref={ref} position={[car.x, 0.24, car.z]} rotation={[0, car.rot, 0]}>
      <mesh castShadow position={[0, 0.32, 0]}>
        <boxGeometry args={[width, 0.58, length]} />
        <meshStandardMaterial color={car.color} metalness={car.class === "luxury" ? 0.65 : 0.28} roughness={car.class === "economy" ? 0.6 : 0.36} />
      </mesh>
      <mesh castShadow position={[0, 0.78, car.model === "sports" ? -0.12 : 0.15]}>
        <boxGeometry args={[width * 0.82, car.model === "sports" ? 0.46 : 0.68, length * 0.52]} />
        <meshStandardMaterial color="#343b3d" roughness={0.18} metalness={0.45} />
      </mesh>
      {[-1, 1].flatMap((side) => [-1, 1].map((front) => (
        <mesh key={`${side}_${front}`} position={[side * (width / 2 + 0.02), 0.23, front * (length * 0.3)]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.16, 10]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      )))}
    </group>
  );
}

function MetroChunk({ data, chunkSize }: { data: ChunkData; chunkSize: number }) {
  const renderData = useMemo(() => {
    const [cx, cz] = data.id.split("_").map(Number);
    const minX = cx * chunkSize;
    const maxX = minX + chunkSize;
    const minZ = cz * chunkSize;
    const maxZ = minZ + chunkSize;
    const overlapsLoopMap = minX < 260 && maxX > -260 && minZ < 260 && maxZ > -260;
    if (!overlapsLoopMap) return data;
    const isLoopFeature = (x: number, z: number) => Math.abs(x) <= 250 && Math.abs(z) <= 250;
    return {
      ...data,
      buildings: data.buildings.filter((building) => !isLoopFeature(building.x, building.z)),
      roads: data.roads.filter((road) => !road.points.every(([x, z]) => isLoopFeature(x, z))),
      parkedCars: data.parkedCars.filter((car) => !isLoopFeature(car.x, car.z)),
      trafficRoutes: data.trafficRoutes.filter((route) => !route.points.every(([x, z]) => isLoopFeature(x, z))),
    };
  }, [data, chunkSize]);
  const geometries = useMemo(() => createChunkGeometry(renderData), [renderData]);
  const glassTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const texture = getSkyscraperTexture();
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  const [cx, cz] = data.id.split("_").map(Number);

  useEffect(() => () => {
    geometries.buildings.forEach((geometry) => geometry?.dispose());
    geometries.roads?.dispose();
  }, [geometries]);

  return (
    <group>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[(cx + 0.5) * chunkSize, -0.16, (cz + 0.5) * chunkSize]}
        receiveShadow
      >
        <planeGeometry args={[chunkSize, chunkSize]} />
        <meshStandardMaterial color="#b5b5ae" roughness={0.93} />
      </mesh>
      {geometries.buildings.map((geometry, index) => geometry && (
        <mesh key={index} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            map={glassTexture ?? undefined}
            color={FACADE_COLORS[index]}
            roughness={0.38}
            metalness={0.38}
            envMapIntensity={0.8}
          />
        </mesh>
      ))}
      {geometries.roads && (
        <mesh geometry={geometries.roads} receiveShadow>
          <meshStandardMaterial color="#333638" roughness={0.9} />
        </mesh>
      )}
      {renderData.parkedCars.map((car) => (
        <VehicleMesh key={car.id} car={car} moving={false} seed={0} />
      ))}
      {renderData.trafficRoutes.map((route) => {
        const id = Number.parseInt(route.id, 10);
        const first = route.points[0];
        if (!first) return null;
        const urban = Math.hypot(first[0], first[1]) < 5000;
        const model = urban && id % 8 === 0 ? "sports" : id % 3 === 0 ? "suv" : "sedan";
        const color = model === "sports" ? "#6d1e1c" : id % 5 === 0 ? "#e4e1d9" : "#47535a";
        return (
          <VehicleMesh
            key={`traffic_${route.id}`}
            car={{ id: route.id, x: first[0], z: first[1], rot: 0, model, class: urban ? "luxury" : "economy", color, points: route.points }}
            moving
            seed={Number.isFinite(id) ? id : 0}
          />
        );
      })}
    </group>
  );
}

export default function MetroChunkLayer({ net }: { net: Net }) {
  const [index, setIndex] = useState<ChunkIndex | null>(null);
  const [center, setCenter] = useState("0_0");
  const [loaded, setLoaded] = useState<Record<string, ChunkData>>({});
  const [error, setError] = useState("");
  const [retryTick, setRetryTick] = useState(0);
  const retryState = useRef({ key: "", attempts: 0 });

  useEffect(() => {
    const controller = new AbortController();
    fetchWithRetry("/chicago-metro-index.json", controller.signal)
      .then((response) => {
        if (!response.ok) throw new Error(`Metro index request failed (${response.status}).`);
        return response.json() as Promise<ChunkIndex>;
      })
      .then((value) => {
        if (!controller.signal.aborted) {
          setIndex(value);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Could not load Greater Chicago map index.");
        }
      });
    return () => controller.abort();
  }, []);

  useFrame(() => {
    if (!index || !net.me) return;
    const position = net.pos.get(net.me);
    if (!position) return;
    const key = `${Math.floor(position.x / index.chunkSize)}_${Math.floor(position.z / index.chunkSize)}`;
    setCenter((current) => current === key ? current : key);
  });

  const neededIds = useMemo(() => {
    if (!index) return [];
    const [cx, cz] = center.split("_").map(Number);
    const available = new Set(index.chunks.map((chunk) => chunk.id));
    const ids: string[] = [];
    for (let x = cx - CHUNK_RADIUS; x <= cx + CHUNK_RADIUS; x += 1) {
      for (let z = cz - CHUNK_RADIUS; z <= cz + CHUNK_RADIUS; z += 1) {
        const id = `${x}_${z}`;
        if (available.has(id)) ids.push(id);
      }
    }
    return ids;
  }, [center, index]);

  useEffect(() => {
    if (!index || neededIds.length === 0) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const key = neededIds.join("|");
    if (retryState.current.key !== key) {
      retryState.current = { key, attempts: 0 };
      setError("");
    }
    const entries = new Map(index.chunks.map((chunk) => [chunk.id, chunk.files]));
    const missing = neededIds.filter((id) => !loaded[id]);
    if (missing.length === 0) {
      setError("");
      return;
    }

    const loadChunk = async (id: string): Promise<ChunkData> => {
      const files = entries.get(id);
      if (!files) throw new Error(`Metro chunk ${id} is missing from the regional index.`);
      const loadRecords = async <T,>(file: string | undefined, kind: string): Promise<T[]> => {
        if (!file) return [];
        const response = await fetchWithRetry(`/${file}`);
        if (!response.ok) throw new Error(`Metro chunk ${id} ${kind} failed to load (${response.status}).`);
        if (!response.body || typeof DecompressionStream === "undefined") {
          throw new Error(`Metro chunk ${id} ${kind} requires browser gzip decompression support.`);
        }
        const decompressed = response.body.pipeThrough(new DecompressionStream("gzip"));
        const lines = (await new Response(decompressed).text()).split(/\r?\n/).filter(Boolean);
        return lines.flatMap((line) => {
          const records: unknown = JSON.parse(line);
          if (!Array.isArray(records)) throw new Error(`Metro chunk ${id} ${kind} contains invalid data.`);
          return records as T[];
        });
      };
      const [buildings, roads, trafficRoutes, parkedCars] = await Promise.all([
        loadRecords<Building>(files.buildings, "buildings"),
        loadRecords<Road>(files.roads, "roads"),
        loadRecords<TrafficRoute>(files.trafficRoutes, "traffic routes"),
        loadRecords<Car>(files.parkedCars, "parked cars"),
      ]);
      return { id, buildings, roads, trafficRoutes, parkedCars };
    };

    const getChunk = (id: string) => {
      const existing = pendingChunkLoads.get(id);
      if (existing) return existing;
      const request = loadChunk(id).finally(() => pendingChunkLoads.delete(id));
      pendingChunkLoads.set(id, request);
      return request;
    };

    const loadMissingChunks = async () => {
      const chunks: ChunkData[] = [];
      const failures: Array<{ id: string; reason: unknown }> = [];
      let next = 0;
      const workers = Array.from({ length: Math.min(2, missing.length) }, async () => {
        while (!cancelled) {
          const index = next;
          next += 1;
          if (index >= missing.length) return;
          try {
            chunks[index] = await getChunk(missing[index]);
          } catch (reason) {
            if (cancelled) return;
            failures.push({ id: missing[index], reason });
          }
        }
      });
      await Promise.all(workers);
      return { chunks: chunks.filter((chunk): chunk is ChunkData => chunk !== undefined), failures };
    };

    loadMissingChunks()
      .then(({ chunks, failures }) => {
        if (!cancelled) {
          if (chunks.length > 0) {
            setLoaded((current) => {
              const next = { ...current };
              chunks.forEach((chunk) => { next[chunk.id] = chunk; });
              return next;
            });
          }
          if (failures.length === 0) {
            retryState.current.attempts = 0;
            setError("");
            return;
          }

          retryState.current.attempts += 1;
          if (retryState.current.attempts <= 3) {
            retryTimer = setTimeout(
              () => setRetryTick((current) => current + 1),
              retryState.current.attempts * 500,
            );
            return;
          }
          const failure = failures[0];
          const message = failure.reason instanceof Error
            ? failure.reason.message
            : "Could not load a Greater Chicago map tile.";
          setError(`Metro chunk ${failure.id} failed to load: ${message}`);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Could not load a Greater Chicago map tile.");
        }
      });

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [index, neededIds, loaded, retryTick]);

  useEffect(() => {
    setLoaded((current) => Object.fromEntries(
      Object.entries(current).filter(([id]) => neededIds.includes(id)),
    ));
  }, [neededIds]);

  const position = net.me ? net.pos.get(net.me) : undefined;

  return (
    <>
      <group>
        {neededIds.map((id) => loaded[id] && (
          <MetroChunk key={id} data={loaded[id]} chunkSize={index?.chunkSize ?? 2500} />
        ))}
      </group>
      {error && (
        <Html position={[position?.x ?? 0, 4, position?.z ?? 0]} center>
          <div style={{ color: "#fff", background: "#7f1d1d", padding: "8px 12px", borderRadius: 8, whiteSpace: "nowrap" }}>
            Greater Chicago map temporarily incomplete: {error}
          </div>
        </Html>
      )}
    </>
  );
}
