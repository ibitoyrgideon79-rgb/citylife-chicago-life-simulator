"use client";
import React, { useMemo } from "react";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Html } from "@react-three/drei";
import cityData from "../public/chicago-loop.json";
import { INTERACTIVE_POIS, type POIDefinition } from "../../shared/protocol";
import LoopStreetLife from "./LoopStreetLife";
import type { Net } from "../types/network";
import {
  getSkyscraperTexture,
  getBrickSkyscraperTexture,
  getAsphaltRoadTexture,
  getSidewalkTexture,
  getBillboardTexture,
} from "../utils/cityTextures";

type Building = {
  id: string;
  name?: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

type Road = {
  id: string;
  name?: string;
  type: string;
  width: number;
  points: number[][];
};

type Landmark = {
  name: string;
  x: number;
  z: number;
  height: number;
};

function setSkyscraperUVs(geom: THREE.BoxGeometry, w: number, h: number, d: number) {
  const uv = geom.attributes.uv;
  if (!uv) return;

  const uX = d / 4.0;
  const vY = h / 3.2;
  const uZ = w / 4.0;
  const uRoof = w / 8.0;
  const vRoof = d / 8.0;

  const setFaceUV = (offset: number, uMax: number, vMax: number) => {
    uv.setXY(offset + 0, 0, vMax);
    uv.setXY(offset + 1, uMax, vMax);
    uv.setXY(offset + 2, 0, 0);
    uv.setXY(offset + 3, uMax, 0);
  };

  setFaceUV(0, uX, vY); // +X
  setFaceUV(4, uX, vY); // -X
  setFaceUV(8, uRoof, vRoof); // +Y
  setFaceUV(12, uRoof, vRoof); // -Y
  setFaceUV(16, uZ, vY); // +Z
  setFaceUV(20, uZ, vY); // -Z
  uv.needsUpdate = true;
}

export default function CityMap({
  net,
  activePoiId,
  onInteractPoi,
}: {
  net: Net;
  activePoiId?: string | null;
  onInteractPoi?: (poi: POIDefinition) => void;
}) {
  const { buildings, roads, landmarks } = cityData as unknown as {
    buildings: Building[];
    roads: Road[];
    landmarks: Landmark[];
  };

  // Textures
  const glassTex = useMemo(() => (typeof window !== "undefined" ? getSkyscraperTexture() : null), []);
  const brickTex = useMemo(() => (typeof window !== "undefined" ? getBrickSkyscraperTexture() : null), []);
  const roadTex = useMemo(() => (typeof window !== "undefined" ? getAsphaltRoadTexture() : null), []);
  const sidewalkTex = useMemo(() => {
    if (typeof window === "undefined") return null;
    const tex = getSidewalkTexture();
    tex.repeat.set(130, 130);
    return tex;
  }, []);
  const billboardTex1 = useMemo(
    () =>
      typeof window !== "undefined"
        ? getBillboardTexture("LOOP FINANCIAL DISTRICT", "TRADING FLOOR JOBS · $1,200/SHIFT", "#00f2fe")
        : null,
    []
  );
  const billboardTex2 = useMemo(
    () =>
      typeof window !== "undefined"
        ? getBillboardTexture("STATE STREET MALL", "RETAIL & DINING · HIRING NOW", "#f59e0b")
        : null,
    []
  );

  // 1. Build Free Fire-Grade Skyscraper Geometries with Tiered Setbacks, Fins & Rooftops
  const {
    glassGeometry,
    brickGeometry,
    stoneGeometry,
    darkGlassGeometry,
    mullionGeometry,
    rooftopGeometry,
    sidewalkPlazaGeometry,
    roadGeometry,
  } = useMemo(() => {
    const glassGeoms: THREE.BufferGeometry[] = [];
    const brickGeoms: THREE.BufferGeometry[] = [];
    const stoneGeoms: THREE.BufferGeometry[] = [];
    const darkGlassGeoms: THREE.BufferGeometry[] = [];
    const mullionGeoms: THREE.BufferGeometry[] = [];
    const roofGeoms: THREE.BufferGeometry[] = [];
    const plazaGeoms: THREE.BufferGeometry[] = [];

    buildings.forEach((b, idx) => {
      const style = (idx + [...(b.id ?? "")].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 4;
      const isHistoric = style === 0;
      const mainGeoms = style === 0 ? brickGeoms : style === 2 ? stoneGeoms : style === 3 ? darkGlassGeoms : glassGeoms;

      // ─── A. TIERED SETBACK GEOMETRY ───
      if (b.h > 45) {
        const podiumH = Math.min(18, Math.max(9, b.h * 0.18));
        const podium = new THREE.BoxGeometry(b.w, podiumH, b.d);
        setSkyscraperUVs(podium, b.w, podiumH, b.d);
        podium.translate(b.x, podiumH / 2, b.z);

        const midH = b.h * [0.52, 0.68, 0.45, 0.61][style];
        const setback = [2.2, 5.4, 1.2, 3.8][style];
        const midW = Math.max(8, b.w - setback);
        const midD = Math.max(8, b.d - setback);
        const midTower = new THREE.BoxGeometry(midW, midH, midD);
        setSkyscraperUVs(midTower, midW, midH, midD);
        midTower.translate(b.x, podiumH + midH / 2, b.z);

        const topH = b.h - podiumH - midH;
        const crownSetback = [6.4, 2.4, 8.2, 4.6][style];
        const topW = Math.max(6, midW - crownSetback);
        const topD = Math.max(6, midD - crownSetback);
        const topTower = new THREE.BoxGeometry(topW, topH, topD);
        setSkyscraperUVs(topTower, topW, topH, topD);
        topTower.translate(
          b.x + (style === 1 ? b.w * 0.04 : 0),
          podiumH + midH + topH / 2,
          b.z + (style === 3 ? b.d * 0.035 : 0),
        );

        mainGeoms.push(podium, midTower, topTower);

        // Stepped Cornice Ledges at setbacks
        const ledge1 = new THREE.BoxGeometry(b.w + 0.6, 0.6, b.d + 0.6);
        ledge1.translate(b.x, podiumH, b.z);
        mullionGeoms.push(ledge1);

        const ledge2 = new THREE.BoxGeometry(midW + 0.6, 0.6, midD + 0.6);
        ledge2.translate(b.x, podiumH + midH, b.z);
        mullionGeoms.push(ledge2);
      } else if (b.h > 28 && (style === 1 || style === 3)) {
        const lowerH = b.h * 0.78;
        const lower = new THREE.BoxGeometry(b.w, lowerH, b.d);
        setSkyscraperUVs(lower, b.w, lowerH, b.d);
        lower.translate(b.x, lowerH / 2, b.z);
        const upperW = Math.max(6, b.w - (style === 1 ? 4.5 : 8));
        const upperD = Math.max(6, b.d - (style === 1 ? 4.5 : 8));
        const upperH = b.h - lowerH;
        const upper = new THREE.BoxGeometry(upperW, upperH, upperD);
        setSkyscraperUVs(upper, upperW, upperH, upperD);
        upper.translate(b.x, lowerH + upperH / 2, b.z);
        mainGeoms.push(lower, upper);
      } else {
        const box = new THREE.BoxGeometry(b.w, b.h, b.d);
        setSkyscraperUVs(box, b.w, b.h, b.d);
        box.translate(b.x, b.h / 2, b.z);
        mainGeoms.push(box);
      }

      // ─── B. 3D EXTERIOR STRUCTURAL MULLIONS / WINDOW FINS ───
      // Adds real protruding physical columns that catch directional sunlight
      const finSpacing = [4.2, 6.5, 5.2, 8][style];
      const xFins = Math.floor(b.w / finSpacing);
      const zFins = Math.floor(b.d / finSpacing);

      // Front & Back facade fins (Z faces)
      for (let fi = -xFins / 2; fi <= xFins / 2; fi++) {
        const fx = b.x + fi * finSpacing;
        const finHeight = Math.min(b.h, 60);

        // Front Fin
        const finF = new THREE.BoxGeometry(0.35, finHeight, 0.45);
        finF.translate(fx, finHeight / 2, b.z + b.d / 2 + 0.15);
        mullionGeoms.push(finF);

        // Back Fin
        const finB = new THREE.BoxGeometry(0.35, finHeight, 0.45);
        finB.translate(fx, finHeight / 2, b.z - b.d / 2 - 0.15);
        mullionGeoms.push(finB);
      }

      // Left & Right facade fins (X faces)
      for (let fi = -zFins / 2; fi <= zFins / 2; fi++) {
        const fz = b.z + fi * finSpacing;
        const finHeight = Math.min(b.h, 60);

        const finL = new THREE.BoxGeometry(0.45, finHeight, 0.35);
        finL.translate(b.x + b.w / 2 + 0.15, finHeight / 2, fz);
        mullionGeoms.push(finL);

        const finR = new THREE.BoxGeometry(0.45, finHeight, 0.35);
        finR.translate(b.x - b.w / 2 - 0.15, finHeight / 2, fz);
        mullionGeoms.push(finR);
      }

      // ─── C. CONCRETE SIDEWALK CURB PLAZA ───
      const plaza = new THREE.BoxGeometry(b.w + 2.8, 0.22, b.d + 2.8);
      plaza.translate(b.x, 0.11, b.z);
      plazaGeoms.push(plaza);

      // ─── D. DETAILED ROOFTOPS (WATER TOWERS, HVAC, SPIRES, PARAPETS) ───
      if (b.h > 24 && style !== 1) {
        // Perimeter Parapet Security Wall
        const parapet = new THREE.BoxGeometry(b.w * 0.72, 1.2, b.d * 0.72);
        parapet.translate(b.x, b.h + 0.6, b.z);
        mullionGeoms.push(parapet);

        // Industrial HVAC Chiller Duct Units
        const hvac1 = new THREE.BoxGeometry(4.2, 2.8, 4.2);
        hvac1.translate(b.x + b.w * 0.18, b.h + 2.2, b.z + b.d * 0.18);
        roofGeoms.push(hvac1);

        const hvac2 = new THREE.BoxGeometry(3.5, 2.2, 5.0);
        hvac2.translate(b.x - b.w * 0.18, b.h + 1.8, b.z - b.d * 0.15);
        roofGeoms.push(hvac2);

        // Elevator Machinery Bulkhead Penthouse
        const elevatorShaft = new THREE.BoxGeometry(b.w * 0.35, 4.8, b.d * 0.35);
        elevatorShaft.translate(b.x, b.h + 2.4, b.z);
        roofGeoms.push(elevatorShaft);
      }

      // Rooftop Water Towers on historic buildings
      if (isHistoric && b.h > 35) {
        // Steel Stilt Legs
        const trestle = new THREE.BoxGeometry(3.2, 3.5, 3.2);
        trestle.translate(b.x + b.w * 0.22, b.h + 2.5, b.z + b.d * 0.22);
        mullionGeoms.push(trestle);

        // Wooden/Metal Cylinder Tank
        const tank = new THREE.CylinderGeometry(1.6, 1.6, 3.6, 12);
        tank.translate(b.x + b.w * 0.22, b.h + 5.8, b.z + b.d * 0.22);
        roofGeoms.push(tank);

        // Conical Tank Roof Cap
        const cap = new THREE.ConeGeometry(1.85, 1.2, 12);
        cap.translate(b.x + b.w * 0.22, b.h + 8.1, b.z + b.d * 0.22);
        roofGeoms.push(cap);
      }

      // Communications Spire Antennas for skyscrapers > 60m
      if (b.h > 60 && (style === 2 || style === 3)) {
        const antenna = new THREE.CylinderGeometry(0.18, 0.45, 16, 6);
        antenna.translate(b.x, b.h + 10, b.z);
        roofGeoms.push(antenna);
      }
    });

    // ─── 2. BUILD ROAD GEOMETRIES ───
    const roadSegmentGeoms: THREE.BufferGeometry[] = [];
    roads.forEach((road) => {
      const halfW = (road.width || 14.0) * 0.5;
      const pts = road.points;
      if (pts.length < 2) return;
      const roadY = 0.24;

      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const len = Math.hypot(dx, dz);
        if (len < 0.5) continue;

        const nx = (-dz / len) * halfW;
        const nz = (dx / len) * halfW;

        const vertices = new Float32Array([
          p1[0] - nx, roadY, p1[1] - nz,
          p1[0] + nx, roadY, p1[1] + nz,
          p2[0] - nx, roadY, p2[1] - nz,

          p2[0] - nx, roadY, p2[1] - nz,
          p1[0] + nx, roadY, p1[1] + nz,
          p2[0] + nx, roadY, p2[1] + nz,
        ]);

        const uLen = len / 14;
        const uvs = new Float32Array([
          0, 0,
          1, 0,
          0, uLen,

          0, uLen,
          1, 0,
          1, uLen,
        ]);

        const normals = new Float32Array([
          0, 1, 0, 0, 1, 0, 0, 1, 0,
          0, 1, 0, 0, 1, 0, 0, 1, 0,
        ]);

        const geom = new THREE.BufferGeometry();
        geom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
        geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
        geom.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
        roadSegmentGeoms.push(geom);
      }
    });

    // Merge into single high-performance buffer geometries
    const mergedGlass = glassGeoms.length > 0 ? BufferGeometryUtils.mergeGeometries(glassGeoms, false) : null;
    const mergedBrick = brickGeoms.length > 0 ? BufferGeometryUtils.mergeGeometries(brickGeoms, false) : null;
    const mergedStone = stoneGeoms.length > 0 ? BufferGeometryUtils.mergeGeometries(stoneGeoms, false) : null;
    const mergedDarkGlass = darkGlassGeoms.length > 0 ? BufferGeometryUtils.mergeGeometries(darkGlassGeoms, false) : null;
    const mergedMullions = mullionGeoms.length > 0 ? BufferGeometryUtils.mergeGeometries(mullionGeoms, false) : null;
    const mergedRoof = roofGeoms.length > 0 ? BufferGeometryUtils.mergeGeometries(roofGeoms, false) : null;
    const mergedPlaza = plazaGeoms.length > 0 ? BufferGeometryUtils.mergeGeometries(plazaGeoms, false) : null;
    const mergedRoads = roadSegmentGeoms.length > 0 ? BufferGeometryUtils.mergeGeometries(roadSegmentGeoms, false) : null;

    glassGeoms.forEach((g) => g.dispose());
    brickGeoms.forEach((g) => g.dispose());
    stoneGeoms.forEach((g) => g.dispose());
    darkGlassGeoms.forEach((g) => g.dispose());
    mullionGeoms.forEach((g) => g.dispose());
    roofGeoms.forEach((g) => g.dispose());
    plazaGeoms.forEach((g) => g.dispose());
    roadSegmentGeoms.forEach((g) => g.dispose());

    return {
      glassGeometry: mergedGlass,
      brickGeometry: mergedBrick,
      stoneGeometry: mergedStone,
      darkGlassGeometry: mergedDarkGlass,
      mullionGeometry: mergedMullions,
      rooftopGeometry: mergedRoof,
      sidewalkPlazaGeometry: mergedPlaza,
      roadGeometry: mergedRoads,
    };
  }, [buildings, roads]);

  // Street Props carefully placed STRICTLY ON SIDEWALKS, NEVER ON ROADS!
  const streetProps = useMemo(() => {
    // Modern Chicago streetlights on sidewalk curb edges
    const lampPositions = [
      { x: 12, z: -3.6 }, { x: 32, z: -3.6 }, { x: 52, z: -3.6 },
      { x: 14, z: 16.8 }, { x: 30, z: 16.8 },
      { x: 3.2, z: 32 }, { x: 3.2, z: 54 }, { x: 3.2, z: 76 },
      { x: -16.2, z: 32 }, { x: -16.2, z: 54 }, { x: -16.2, z: 76 },
    ];

    // Trees strictly along sidewalks with iron tree grates
    const trees = [
      { x: 20, z: -3.8 },
      { x: 38, z: -3.8 },
      { x: 56, z: -3.8 },
      { x: 22, z: 16.8 },
      { x: 38, z: 16.8 },
      { x: 3.2, z: 42 },
      { x: 3.2, z: 65 },
      { x: -16.2, z: 42 },
      { x: -16.2, z: 65 },
      { x: -32, z: 22 },
    ];

    // Overhanging traffic light poles at major intersections
    const trafficSignals = [
      { x: -2.0, z: 0.5, rot: 0 },
      { x: -2.0, z: 12.5, rot: Math.PI },
      { x: -14.0, z: 6.5, rot: -Math.PI / 2 },
      { x: 2.0, z: 6.5, rot: Math.PI / 2 },
    ];

    return { lampPositions, trees, trafficSignals };
  }, []);

  return (
    <group>
      {/* 1. Base Concrete Sidewalk Pavement */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.15, 0]} receiveShadow>
        <planeGeometry args={[520, 520]} />
        <meshStandardMaterial
          map={sidewalkTex ?? undefined}
          color="#d1d5db"
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
        />
      </mesh>

      {/* 2. Raised Sidewalk Plazas under building blocks */}
      {sidewalkPlazaGeometry && (
        <mesh geometry={sidewalkPlazaGeometry} receiveShadow>
          <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
        </mesh>
      )}

      {/* 3. Real Asphalt Roads with yellow centerlines & lane markings */}
      {roadGeometry && (
        <mesh geometry={roadGeometry} receiveShadow renderOrder={1} frustumCulled={false}>
          <meshStandardMaterial
            map={roadTex ?? undefined}
            color="#ffffff"
            roughness={0.7}
            metalness={0.1}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      )}

      {/* 4. Modern Glass Skyscrapers with Reflective PBR Curtain Walls */}
      {glassGeometry && (
        <mesh geometry={glassGeometry} castShadow receiveShadow frustumCulled={false}>
          <meshStandardMaterial
            map={glassTex ?? undefined}
            color="#d2d4d2"
            roughness={0.34}
            metalness={0.42}
            envMapIntensity={1.1}
          />
        </mesh>
      )}

      {/* 5. Historic Chicago Brick Skyscrapers with Architectural Terracotta */}
      {brickGeometry && (
        <mesh geometry={brickGeometry} castShadow receiveShadow frustumCulled={false}>
          <meshStandardMaterial
            map={brickTex ?? undefined}
            color="#ffffff"
            roughness={0.75}
            metalness={0.15}
          />
        </mesh>
      )}

      {stoneGeometry && (
        <mesh geometry={stoneGeometry} castShadow receiveShadow frustumCulled={false}>
          <meshStandardMaterial
            map={brickTex ?? undefined}
            color="#d9cdb8"
            roughness={0.7}
            metalness={0.12}
          />
        </mesh>
      )}

      {darkGlassGeometry && (
        <mesh geometry={darkGlassGeometry} castShadow receiveShadow frustumCulled={false}>
          <meshStandardMaterial
            map={glassTex ?? undefined}
            color="#737a7b"
            roughness={0.24}
            metalness={0.62}
            envMapIntensity={1.3}
          />
        </mesh>
      )}

      {/* 6. Protruding 3D Architectural Exterior Columns, Fins & Setback Cornices */}
      {mullionGeometry && (
        <mesh geometry={mullionGeometry} castShadow receiveShadow frustumCulled={false}>
          <meshStandardMaterial
            color="#5b6061"
            roughness={0.56}
            metalness={0.58}
          />
        </mesh>
      )}

      {/* 7. Industrial Rooftops (HVAC Duct Chillers, Machinery Bulkheads, Water Tanks) */}
      {rooftopGeometry && (
        <mesh geometry={rooftopGeometry} castShadow receiveShadow frustumCulled={false}>
          <meshStandardMaterial color="#475569" roughness={0.55} metalness={0.7} />
        </mesh>
      )}

      {/* ────────────────── 8. BUILDING ENTRANCES & DOORS ────────────────── */}

      {/* Dirksen Federal Center Grand Entrance & Canopy (x: 22.4, z: 20.8) */}
      <group position={[22.4, 0, 20.8]}>
        <mesh position={[0, 4.4, 1.8]} castShadow>
          <boxGeometry args={[8.5, 0.45, 3.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 4.15, 1.8]}>
          <planeGeometry args={[8.0, 3.2]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>

        <mesh position={[0, 1.9, 0.1]} castShadow>
          <boxGeometry args={[4.2, 3.6, 0.3]} />
          <meshStandardMaterial color="#09090b" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.95, 1.85, 0.12]}>
          <boxGeometry args={[1.7, 3.2, 0.08]} />
          <meshStandardMaterial color="#60a5fa" transparent opacity={0.55} roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[0.95, 1.85, 0.12]}>
          <boxGeometry args={[1.7, 3.2, 0.08]} />
          <meshStandardMaterial color="#60a5fa" transparent opacity={0.55} roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[-0.2, 1.7, 0.2]}>
          <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0.2, 1.7, 0.2]}>
          <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 3.85, 0.26]}>
          <boxGeometry args={[3.6, 0.42, 0.08]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} />
        </mesh>
      </group>

      {/* Chase Bank & ATM Kiosk Storefront (x: 8.0, z: -3.8) */}
      <group position={[8.0, 0, -3.8]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[1.4, 2.8, 0.9]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.75, 0.46]}>
          <planeGeometry args={[0.8, 0.55]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0, 1.25, 0.48]}>
          <boxGeometry args={[0.85, 0.25, 0.12]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.95, 0.46]}>
          <boxGeometry args={[0.5, 0.06, 0.05]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        <mesh position={[0, 2.7, 0]}>
          <boxGeometry args={[2.0, 0.45, 0.2]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} />
        </mesh>
      </group>

      {/* Loop Artisan Coffee Storefront & Entrance (x: 18.0, z: 18.5) */}
      <group position={[18.0, 0, 18.5]}>
        <mesh position={[0, 3.4, 1.2]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[5.5, 0.15, 2.2]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.7, 0.1]}>
          <planeGeometry args={[4.8, 2.6]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.3} emissive="#ea580c" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[1.4, 1.6, 0.12]}>
          <boxGeometry args={[1.3, 2.8, 0.1]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} />
        </mesh>
        <group position={[-1.6, 0, 2.0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.6, 0.05, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <coneGeometry args={[1.4, 0.7, 16]} />
            <meshStandardMaterial color="#d97706" />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 2.0, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      </group>

      {/* CTA Blue Line Subway Station Entrance Stairs (x: -5.0, z: 2.2) */}
      <group position={[-5.0, 0, 2.2]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[3.2, 1.1, 5.2]} />
          <meshStandardMaterial color="#09090b" wireframe={false} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.6, 0]}>
          <boxGeometry args={[2.7, 1.4, 4.6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        <mesh position={[-1.4, 2.1, 2.3]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[1.4, 2.1, 2.3]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[-1.4, 1.1, 2.3]}>
          <cylinderGeometry args={[0.05, 0.05, 2.0, 8]} />
          <meshStandardMaterial color="#09090b" metalness={0.9} />
        </mesh>
        <mesh position={[1.4, 1.1, 2.3]}>
          <cylinderGeometry args={[0.05, 0.05, 2.0, 8]} />
          <meshStandardMaterial color="#09090b" metalness={0.9} />
        </mesh>
      </group>

      {/* Federal Plaza Courier Job Board Kiosk (x: -24.0, z: 22.0) */}
      <group position={[-24.0, 0, 22.0]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[1.6, 2.8, 0.6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.8, 0.32]}>
          <planeGeometry args={[1.3, 1.1]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      </group>

      {/* ────────────────── 9. URBAN STREETFURNITURE (TRAFFIC LIGHTS & LAMPS) ────────────────── */}
      {/* Overhanging Traffic Signal Gantries at Intersections */}
      {streetProps.trafficSignals.map((ts, idx) => (
        <group key={idx} position={[ts.x, 0, ts.z]} rotation={[0, ts.rot, 0]}>
          {/* Vertical Mast */}
          <mesh position={[0, 3.6, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.22, 7.2, 8]} />
            <meshStandardMaterial color="#18181b" metalness={0.8} />
          </mesh>
          {/* Overhanging Horizontal Arm extending over the street */}
          <mesh position={[2.8, 6.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.1, 0.14, 6.0, 8]} />
            <meshStandardMaterial color="#18181b" metalness={0.8} />
          </mesh>
          {/* Traffic Signal Housing */}
          <group position={[4.2, 6.2, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.5, 1.3, 0.4]} />
              <meshStandardMaterial color="#facc15" roughness={0.4} />
            </mesh>
            {/* Red Light */}
            <mesh position={[0, 0.38, 0.21]}>
              <circleGeometry args={[0.14, 12]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            {/* Yellow Light */}
            <mesh position={[0, 0, 0.21]}>
              <circleGeometry args={[0.14, 12]} />
              <meshBasicMaterial color="#f59e0b" />
            </mesh>
            {/* Green Light */}
            <mesh position={[0, -0.38, 0.21]}>
              <circleGeometry args={[0.14, 12]} />
              <meshBasicMaterial color="#22c55e" />
            </mesh>
          </group>
        </group>
      ))}

      {/* Sidewalk Streetlamps */}
      {streetProps.lampPositions.map((pos, idx) => (
        <group key={idx} position={[pos.x, 0, pos.z]}>
          <mesh position={[0, 3.25, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 6.5, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[0.8, 6.3, 0]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.08, 0.08, 1.8, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[1.4, 6.5, 0]}>
            <sphereGeometry args={[0.32, 12, 12]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}

      {/* Sidewalk Trees */}
      {streetProps.trees.map((t, idx) => (
        <group key={idx} position={[t.x, 0, t.z]}>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 0]}>
            <planeGeometry args={[2.2, 2.2]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.8, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.28, 3.2, 8]} />
            <meshStandardMaterial color="#5c3818" roughness={0.95} />
          </mesh>
          <mesh position={[0, 3.8, 0]} castShadow>
            <sphereGeometry args={[1.5, 10, 10]} />
            <meshStandardMaterial color="#15803d" roughness={0.85} />
          </mesh>
          <mesh position={[0.6, 4.3, 0.4]} castShadow>
            <sphereGeometry args={[1.1, 8, 8]} />
            <meshStandardMaterial color="#16a34a" roughness={0.85} />
          </mesh>
          <mesh position={[-0.5, 4.4, -0.4]} castShadow>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshStandardMaterial color="#14532d" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* ────────────────── 10. INTERACTIVE POI RINGS & FLOATING BADGES ────────────────── */}
      {INTERACTIVE_POIS.map((poi) => {
        const isActive = activePoiId === poi.id;
        const color = isActive ? "#38bdf8" : "#fbbf24";

        return (
          <group key={poi.id} position={[poi.x, 0, poi.z]}>
            <Html position={[0, 2.7, 0]} center distanceFactor={14}>
              <div
                onClick={() => onInteractPoi?.(poi)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  background: isActive ? "rgba(2, 132, 199, 0.95)" : "rgba(15, 23, 42, 0.9)",
                  border: `2px solid ${color}`,
                  borderRadius: "16px",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 800,
                  fontFamily: "system-ui, sans-serif",
                  whiteSpace: "nowrap",
                  boxShadow: isActive ? "0 0 18px rgba(56, 189, 248, 0.8)" : "0 4px 12px rgba(0,0,0,0.5)",
                  cursor: "pointer",
                  transform: isActive ? "scale(1.08)" : "scale(1.0)",
                  transition: "transform 0.2s ease",
                  userSelect: "none",
                }}
              >
                <span style={{ fontSize: "15px" }}>{poi.icon}</span>
                <span>{poi.name}</span>
                {isActive && (
                  <span
                    style={{
                      background: "#ffffff",
                      color: "#0284c7",
                      padding: "1px 6px",
                      borderRadius: "8px",
                      fontSize: "10px",
                      marginLeft: "4px",
                    }}
                  >
                    PRESS [E]
                  </span>
                )}
              </div>
            </Html>
          </group>
        );
      })}

      {/* ────────────────── 11. GLOWING CYBER BILLBOARDS ────────────────── */}
      <group position={[32, 14, 8]}>
        <mesh castShadow>
          <boxGeometry args={[14, 7.5, 0.6]} />
          <meshStandardMaterial color="#09090b" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.35]}>
          <planeGeometry args={[13.2, 6.8]} />
          <meshBasicMaterial map={billboardTex1 ?? undefined} color="#ffffff" />
        </mesh>
      </group>

      <group position={[-42, 16, -18]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[14, 7.5, 0.6]} />
          <meshStandardMaterial color="#09090b" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.35]}>
          <planeGeometry args={[13.2, 6.8]} />
          <meshBasicMaterial map={billboardTex2 ?? undefined} color="#ffffff" />
        </mesh>
      </group>

      {/* ────────────────── 12. CHICAGO LANDMARK MARKERS ────────────────── */}
      {landmarks.slice(0, 6).map((lm, idx) => (
        <group key={idx} position={[lm.x, Math.min(lm.height + 4, 95), lm.z]}>
          <Html center distanceFactor={45}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                background: "rgba(15, 23, 42, 0.92)",
                border: "2px solid #fbbf24",
                borderRadius: "16px",
                color: "#fef08a",
                fontSize: "13px",
                fontWeight: 800,
                fontFamily: "system-ui, sans-serif",
                whiteSpace: "nowrap",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.6)",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              <span>🏛️</span>
              <span>{lm.name}</span>
            </div>
          </Html>
        </group>
      ))}
      <LoopStreetLife net={net} />
    </group>
  );
}
