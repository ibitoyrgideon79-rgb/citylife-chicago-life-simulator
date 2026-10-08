"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CTA_STATIONS, INTERACTIVE_POIS, type POIDefinition } from "../../shared/protocol";

const MAP_SIZE = 900;
const DESTINATION_POIS = INTERACTIVE_POIS.filter((poi) =>
  ["apt_entrance", "chicago_mall_entrance", "chicago_cultural_center", "cta_subway", "loop_coffee", "atm_chase"].includes(poi.id)
);

type Point = { x: number; z: number };
type Road = { id: string; name?: string; type: string; width: number; points: number[][] };
type NamedPlace = Point & { name: string; type: string };
type Overview = {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  roads: Road[];
  landmarks: Array<Point & { name: string; height: number }>;
  source: string;
};
type Destination = Point & { name: string; stationId?: string };

const buttonStyle: React.CSSProperties = {
  border: "1px solid #475569",
  background: "#1e293b",
  color: "#f8fafc",
  padding: "9px 13px",
  borderRadius: 9,
  fontWeight: 700,
  cursor: "pointer",
};

export default function CityGuideModal({
  onClose,
  onUber,
  onTransit,
  playerPosition,
}: {
  onClose: () => void;
  onUber: (x: number, z: number, name: string) => void;
  onTransit: (stationId: string) => void;
  playerPosition: Point | null;
}) {
  const [zoom, setZoom] = useState(1);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [places, setPlaces] = useState<NamedPlace[]>([]);
  const [selected, setSelected] = useState<Destination | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/chicago-metro-overview.json"),
      fetch("/chicago-metro-index.json"),
    ])
      .then(async ([overviewResponse, indexResponse]) => {
        if (!overviewResponse.ok || !indexResponse.ok) {
          throw new Error("Regional map data is not available yet. Build the Chicago metro map and reload.");
        }
        const [mapData, index] = await Promise.all([
          overviewResponse.json() as Promise<Overview>,
          indexResponse.json() as Promise<{ districts: NamedPlace[] }>,
        ]);
        if (!cancelled) {
          setOverview(mapData);
          setPlaces(index.districts.filter((place) => ["city", "town", "suburb", "borough", "village"].includes(place.type)));
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load Chicago-area map data.");
      });
    return () => { cancelled = true; };
  }, []);

  const toMapPosition = (point: Point) => {
    const bounds = overview?.bounds;
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: ((point.x - bounds.minX) / (bounds.maxX - bounds.minX)) * MAP_SIZE,
      y: ((point.z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * MAP_SIZE,
    };
  };

  const nearestRoadPoint = (point: Point): Destination => {
    let nearest = { x: point.x, z: point.z, name: "Chicago area" };
    let shortestDistance = Number.POSITIVE_INFINITY;
    for (const road of overview?.roads ?? []) {
      for (let i = 0; i < road.points.length - 1; i += 1) {
        const [x1, z1] = road.points[i];
        const [x2, z2] = road.points[i + 1];
        const dx = x2 - x1;
        const dz = z2 - z1;
        const lengthSquared = dx * dx + dz * dz;
        if (lengthSquared === 0) continue;
        const t = Math.max(0, Math.min(1, ((point.x - x1) * dx + (point.z - z1) * dz) / lengthSquared));
        const x = x1 + t * dx;
        const z = z1 + t * dz;
        const distance = Math.hypot(point.x - x, point.z - z);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearest = { x, z, name: road.name || "Chicago area street" };
        }
      }
    }
    return nearest;
  };

  const visiblePlaces = useMemo(() => places.slice(0, 80), [places]);
  const handleMapClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!overview) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const screenX = (event.clientX - rect.left) / rect.width;
    const screenY = (event.clientY - rect.top) / rect.height;
    const mapX = ((screenX - 0.5) / zoom + 0.5) * MAP_SIZE;
    const mapY = ((screenY - 0.5) / zoom + 0.5) * MAP_SIZE;
    const bounds = overview.bounds;
    const destination = nearestRoadPoint({
      x: bounds.minX + (mapX / MAP_SIZE) * (bounds.maxX - bounds.minX),
      z: bounds.minZ + (mapY / MAP_SIZE) * (bounds.maxZ - bounds.minZ),
    });
    setSelected(destination);
  };

  const selectPoi = (poi: POIDefinition) => setSelected({ x: poi.x, z: poi.z, name: poi.name });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Greater Chicago city map"
      style={{
        position: "fixed", inset: 0, zIndex: 75, padding: 20, display: "grid", placeItems: "center",
        background: "rgba(2, 6, 23, 0.86)", backdropFilter: "blur(12px)", color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <section style={{
        width: "min(1220px, 100%)", maxHeight: "94dvh", overflow: "auto", padding: 20, borderRadius: 20,
        border: "1px solid rgba(148, 163, 184, 0.35)", background: "#0f172a", boxShadow: "0 24px 80px rgba(0,0,0,.65)",
      }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ color: "#38bdf8", fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>CHICAGO METROPOLITAN AREA</div>
            <h2 style={{ margin: "3px 0", fontSize: 24 }}>Greater Chicago · City Map</h2>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>Explore mapped regional streets, zoom, then select a destination to travel.</div>
          </div>
          <button onClick={onClose} aria-label="Close city map" style={buttonStyle}>CLOSE ×</button>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 280px)", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ overflow: "hidden", border: "1px solid #334155", borderRadius: 14, background: "#111827" }}>
              <svg
                viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
                role="img"
                aria-label="Map of the Chicago metropolitan area"
                onClick={handleMapClick}
                style={{ display: "block", width: "100%", maxHeight: "68dvh", cursor: overview ? "crosshair" : "wait", touchAction: "manipulation" }}
              >
                <rect width={MAP_SIZE} height={MAP_SIZE} fill="#18232d" />
                <g transform={`translate(${MAP_SIZE / 2} ${MAP_SIZE / 2}) scale(${zoom}) translate(${-MAP_SIZE / 2} ${-MAP_SIZE / 2})`}>
                  {(overview?.roads ?? []).map((road) => (
                    <polyline
                      key={road.id}
                      points={road.points.map(([x, z]) => {
                        const point = toMapPosition({ x, z });
                        return `${point.x},${point.y}`;
                      }).join(" ")}
                      fill="none"
                      stroke={["motorway", "trunk"].includes(road.type) ? "#f4a261" : ["primary", "secondary"].includes(road.type) ? "#d5dce3" : "#8293a0"}
                      strokeWidth={["motorway", "trunk", "primary"].includes(road.type) ? 2.5 : 1.05}
                      strokeLinecap="round"
                      opacity={["motorway", "trunk", "primary"].includes(road.type) ? 0.88 : 0.58}
                    />
                  ))}
                  {overview?.landmarks.slice(0, 250).map((landmark, index) => {
                    const point = toMapPosition(landmark);
                    return <circle key={`${landmark.name}_${index}`} cx={point.x} cy={point.y} r={landmark.height > 80 ? 2.5 : 1.4} fill="#94a3b8" opacity="0.65" />;
                  })}
                  {CTA_STATIONS.map((station) => {
                    const point = toMapPosition(station);
                    return (
                      <g key={station.id} role="button" tabIndex={0} aria-label={`Select CTA station ${station.name}`} onClick={(event) => {
                        event.stopPropagation();
                        setSelected({ x: station.x, z: station.z, name: `CTA ${station.name}`, stationId: station.id });
                      }} style={{ cursor: "pointer" }}>
                        <rect x={point.x - 4} y={point.y - 4} width="8" height="8" rx="2" fill="#a78bfa" stroke="#fff" strokeWidth="1" />
                      </g>
                    );
                  })}
                  {visiblePlaces.map((place, index) => {
                    const point = toMapPosition(place);
                    return (
                      <g key={`${place.name}_${index}`} onClick={(event) => {
                        event.stopPropagation();
                        setSelected(nearestRoadPoint(place));
                      }} style={{ cursor: "pointer" }}>
                        <circle cx={point.x} cy={point.y} r="5" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />
                        {index < 30 && (
                          <text x={point.x + 7} y={point.y - 6} fill="#e2e8f0" fontSize="12" stroke="#0f172a" strokeWidth="3" paintOrder="stroke">
                            {place.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {DESTINATION_POIS.map((poi) => {
                    const point = toMapPosition(poi);
                    const active = selected?.name === poi.name;
                    return (
                      <g key={poi.id} role="button" tabIndex={0} aria-label={`Select ${poi.name}`} onClick={(event) => {
                        event.stopPropagation();
                        selectPoi(poi);
                      }} style={{ cursor: "pointer" }}>
                        <circle cx={point.x} cy={point.y} r={active ? 7 : 5} fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                      </g>
                    );
                  })}
                  {playerPosition && (
                    <g>
                      {(() => {
                        const point = toMapPosition(playerPosition);
                        return <><circle cx={point.x} cy={point.y} r="12" fill="#22c55e" opacity="0.3" /><circle cx={point.x} cy={point.y} r="5" fill="#4ade80" stroke="#fff" strokeWidth="2" /></>;
                      })()}
                    </g>
                  )}
                  {selected && (() => {
                    const point = toMapPosition(selected);
                    return <circle cx={point.x} cy={point.y} r="9" fill="none" stroke="#facc15" strokeWidth="3" />;
                  })()}
                  <text x="22" y="38" fill="#f8fafc" fontSize="20" fontWeight="800">N ↑</text>
                </g>
              </svg>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10, color: "#cbd5e1", fontSize: 12 }}>
              <button onClick={() => setZoom((value) => Math.min(5, value * 1.35))} style={buttonStyle}>＋ Zoom in</button>
              <button onClick={() => setZoom((value) => Math.max(1, value / 1.35))} style={buttonStyle}>− Zoom out</button>
              <span>● <span style={{ color: "#4ade80" }}>Your location</span></span>
              <span>● <span style={{ color: "#38bdf8" }}>Community</span></span>
              <span style={{ color: "#94a3b8" }}>{overview?.source ?? "© OpenStreetMap contributors, ODbL 1.0"}</span>
            </div>
          </div>

          <aside style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: "4px 0", fontSize: 16 }}>Choose a destination</h3>
            {error && <div role="alert" style={{ color: "#fecaca", background: "#7f1d1d", padding: 10, borderRadius: 8 }}>{error}</div>}
            {!overview && !error && <div style={{ color: "#94a3b8" }}>Loading Chicago-area street map…</div>}
            {selected && (
              <div style={{ padding: 12, borderRadius: 10, border: "1px solid #475569", background: "#1e293b" }}>
                <div style={{ fontWeight: 800 }}>{selected.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>{Math.round(selected.x)} m E/W · {Math.round(selected.z)} m N/S of downtown</div>
                <button onClick={() => onUber(selected.x, selected.z, selected.name)} style={{ ...buttonStyle, width: "100%", marginTop: 10, background: "#14532d" }}>
                  Call Uber · est. ${Math.max(4, Math.round((4 + Math.hypot((playerPosition?.x ?? 0) - selected.x, (playerPosition?.z ?? 0) - selected.z) / 1000 * 1.35) * 100) / 100)}
                </button>
                {selected.stationId && (
                  <button onClick={() => onTransit(selected.stationId!)} style={{ ...buttonStyle, width: "100%", marginTop: 8, background: "#5b21b6" }}>Ride CTA · $2.50</button>
                )}
              </div>
            )}
            <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>CTA rail stations</div>
            {CTA_STATIONS.map((station) => (
              <button key={station.id} onClick={() => setSelected({ x: station.x, z: station.z, name: `CTA ${station.name}`, stationId: station.id })} style={{ ...buttonStyle, textAlign: "left" }}>
                🚇 {station.name} <span style={{ color: "#94a3b8", fontSize: 10 }}>· {station.line}</span>
              </button>
            ))}
            <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>Chicago destinations</div>
            {DESTINATION_POIS.map((poi) => (
              <button key={poi.id} onClick={() => selectPoi(poi)} style={{ ...buttonStyle, textAlign: "left" }}>
                {poi.icon} {poi.name}
              </button>
            ))}
            <div style={{ color: "#64748b", fontSize: 11, lineHeight: 1.5, marginTop: "auto" }}>
              Click a point and call a driver, or walk to a marked CTA station and board. Regional geometry comes from OpenStreetMap data for Illinois, Indiana and Wisconsin.
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
