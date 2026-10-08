"use client";
import React, { useState } from "react";
import type { Net } from "../types/network";
import { MSG } from "../../shared/protocol";

type MapLocation = {
  id: string;
  name: string;
  category: "Landmark" | "Safehouse" | "Shopping" | "Food" | "Transit" | "Work";
  x: number;
  z: number;
  icon: string;
  description: string;
};

const CITY_LOCATIONS: MapLocation[] = [
  {
    id: "loc_safehouse",
    name: "Adams St Penthouse Safehouse",
    category: "Safehouse",
    x: 14.0,
    z: -3.8,
    icon: "🏠",
    description: "Your luxury residence with King Bed, Wardrobe, and Fridge.",
  },
  {
    id: "loc_mall",
    name: "Block 37 Chicago Loop Mega Mall",
    category: "Shopping",
    x: -8.0,
    z: -26.0,
    icon: "🛍️",
    description: "4-story shopping atrium with food court, offices, and college.",
  },
  {
    id: "loc_willis",
    name: "Willis Tower (Sears Tower)",
    category: "Landmark",
    x: -22.0,
    z: 14.0,
    icon: "🏢",
    description: "110-story skyscraper landmark with Skydeck 103.",
  },
  {
    id: "loc_culture",
    name: "Chicago Cultural Center",
    category: "Landmark",
    x: 0,
    z: 28.0,
    icon: "🏛️",
    description: "Historic 1897 architectural wonder with Tiffany stained-glass dome.",
  },
  {
    id: "loc_chase",
    name: "Chase Tower & Financial Plaza",
    category: "Work",
    x: 8.0,
    z: -3.8,
    icon: "🏦",
    description: "Chicago banking hub and 24/7 ATM allowance center.",
  },
  {
    id: "loc_pizza",
    name: "Lou's Deep Dish Pizza Stand",
    category: "Food",
    x: 28.0,
    z: 6.0,
    icon: "🍕",
    description: "Authentic Chicago buttercrust stuffed deep-dish slices.",
  },
  {
    id: "loc_coffee",
    name: "Loop Artisan Coffee Co.",
    category: "Food",
    x: 18.0,
    z: 18.5,
    icon: "☕",
    description: "Dark roast espresso and energy boosts.",
  },
  {
    id: "loc_subway",
    name: "CTA Blue Line Subway Hub",
    category: "Transit",
    x: -5.0,
    z: 2.2,
    icon: "🚇",
    description: "Underground Chicago pedway network and train connections.",
  },
  {
    id: "loc_college",
    name: "Chicago Loop College Campus",
    category: "Work",
    x: -42.0,
    z: -38.0,
    icon: "🎓",
    description: "Higher education campus and lecture hall classrooms.",
  },
  {
    id: "loc_hospital",
    name: "Northwestern Memorial Hospital",
    category: "Work",
    x: 48.0,
    z: -45.0,
    icon: "🩺",
    description: "Premier Level 1 Trauma medical center in downtown Chicago.",
  },
];

export default function CityMapModal({
  net,
  onClose,
}: {
  net: Net;
  onClose: () => void;
}) {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 0.6 = entire city, 1.4 = zoomed in
  const [selectedLoc, setSelectedLoc] = useState<MapLocation>(CITY_LOCATIONS[0]);

  const mePos = net.me ? net.pos.get(net.me) : null;
  const playerX = mePos?.x ?? 0;
  const playerZ = mePos?.z ?? 0;

  const handleFastTravel = (loc: MapLocation) => {
    if (!net.room) return;
    net.room.send(MSG.fast_travel, {
      x: loc.x,
      z: loc.z,
      name: loc.name,
    });
    onClose();
  };

  // Convert city coords (-120..120) to map percentage (0..100)
  const mapSpan = 180; // meters total visible
  const toMapPctX = (x: number) => ((x + mapSpan / 2) / mapSpan) * 100;
  const toMapPctY = (z: number) => ((z + mapSpan / 2) / mapSpan) * 100;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 85,
        backgroundColor: "rgba(3, 7, 18, 0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          height: "88vh",
          backgroundColor: "rgba(15, 23, 42, 0.96)",
          border: "1.5px solid rgba(56, 189, 248, 0.4)",
          borderRadius: "20px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(56, 189, 248, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            background: "linear-gradient(90deg, rgba(2, 132, 199, 0.3), rgba(15, 23, 42, 0.8))",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🗺️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, letterSpacing: "0.5px" }}>
                CHICAGO LOOP METROPOLITAN MAP
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                Zoom out to view the entire city. Click any landmark to fast travel.
              </p>
            </div>
          </div>

          {/* Zoom controls and close */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(30, 41, 59, 0.8)", padding: "4px 8px", borderRadius: "8px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Zoom:</span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                style={{
                  background: "#1e293b",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
                title="Zoom Out to Entire City"
              >
                🔍 -
              </button>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", minWidth: "40px", textAlign: "center" }}>
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.2))}
                style={{
                  background: "#1e293b",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
                title="Zoom In"
              >
                🔍 +
              </button>
              <button
                onClick={() => setZoomLevel(0.65)}
                style={{
                  background: "#0284c7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                FULL CITY
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "8px",
                padding: "6px 14px",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              CLOSE [ESC]
            </button>
          </div>
        </div>

        {/* Map Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left: Interactive 2D Chicago Grid Canvas */}
          <div
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#090d16",
              backgroundImage:
                "linear-gradient(rgba(30, 41, 59, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 41, 59, 0.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          >
            {/* Lake Michigan Water Boundary on the right */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                width: "18%",
                background: "linear-gradient(90deg, rgba(2, 132, 199, 0.2), rgba(3, 105, 161, 0.6))",
                borderLeft: "2px solid #0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
                fontWeight: 800,
                fontSize: "13px",
                letterSpacing: "2px",
                writingMode: "vertical-rl",
              }}
            >
              🌊 LAKE MICHIGAN
            </div>

            {/* Chicago River Boundary on top */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: "18%",
                height: "10%",
                background: "linear-gradient(180deg, rgba(2, 132, 199, 0.3), rgba(2, 132, 199, 0.05))",
                borderBottom: "2px dashed #0284c7",
                display: "flex",
                alignItems: "center",
                paddingLeft: "20px",
                color: "#7dd3fc",
                fontWeight: 700,
                fontSize: "11px",
              }}
            >
              CHICAGO RIVER · LOOP NORTH BORDER
            </div>

            {/* Transform Container with Zoom */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease-out",
              }}
            >
              {/* Chicago Loop Street Labels */}
              <div style={{ position: "absolute", top: "25%", left: "30%", color: "rgba(148, 163, 184, 0.35)", fontWeight: 800, fontSize: "14px", letterSpacing: "3px" }}>
                MICHIGAN AVENUE
              </div>
              <div style={{ position: "absolute", top: "50%", left: "20%", color: "rgba(148, 163, 184, 0.35)", fontWeight: 800, fontSize: "14px", letterSpacing: "3px" }}>
                STATE STREET FINANCIAL CORRIDOR
              </div>
              <div style={{ position: "absolute", top: "75%", left: "35%", color: "rgba(148, 163, 184, 0.35)", fontWeight: 800, fontSize: "14px", letterSpacing: "3px" }}>
                JACKSON BOULEVARD
              </div>

              {/* Player Position Blip */}
              <div
                style={{
                  position: "absolute",
                  left: `${toMapPctX(playerX)}%`,
                  top: `${toMapPctY(playerZ)}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#00f2fe",
                    border: "3px solid #ffffff",
                    boxShadow: "0 0 16px #00f2fe, 0 0 30px #00f2fe",
                    animation: "pulse 1s infinite alternate",
                  }}
                />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 900,
                    color: "#00f2fe",
                    background: "rgba(0,0,0,0.85)",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    marginTop: "2px",
                    whiteSpace: "nowrap",
                  }}
                >
                  YOU ARE HERE
                </span>
              </div>

              {/* Landmark Interactive Pins */}
              {CITY_LOCATIONS.map((loc) => {
                const isSelected = loc.id === selectedLoc.id;
                const pctX = toMapPctX(loc.x);
                const pctY = toMapPctY(loc.z);

                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLoc(loc)}
                    onDoubleClick={() => handleFastTravel(loc)}
                    style={{
                      position: "absolute",
                      left: `${pctX}%`,
                      top: `${pctY}%`,
                      transform: `translate(-50%, -50%) scale(${isSelected ? 1.25 : 1})`,
                      zIndex: isSelected ? 15 : 10,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: isSelected
                          ? "linear-gradient(135deg, #0284c7, #38bdf8)"
                          : "rgba(15, 23, 42, 0.9)",
                        border: isSelected ? "2px solid #ffffff" : "1.5px solid rgba(56, 189, 248, 0.5)",
                        boxShadow: isSelected
                          ? "0 0 18px #38bdf8, 0 4px 12px rgba(0,0,0,0.7)"
                          : "0 4px 10px rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                      }}
                    >
                      {loc.icon}
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: isSelected ? "#38bdf8" : "#e2e8f0",
                        background: "rgba(15, 23, 42, 0.85)",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        marginTop: "2px",
                        whiteSpace: "nowrap",
                        border: isSelected ? "1px solid #38bdf8" : "none",
                      }}
                    >
                      {loc.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Location Detail Card */}
          <div
            style={{
              width: "320px",
              borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              background: "rgba(15, 23, 42, 0.8)",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              Selected Landmark Destination
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ fontSize: "36px" }}>{selectedLoc.icon}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#fff" }}>
                  {selectedLoc.name}
                </h3>
                <span
                  style={{
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {selectedLoc.category}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 16px 0" }}>
              {selectedLoc.description}
            </p>

            <div
              style={{
                background: "rgba(30, 41, 59, 0.5)",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                fontSize: "12px",
                color: "#94a3b8",
                marginBottom: "20px",
              }}
            >
              <div>📍 Coordinates: [{selectedLoc.x.toFixed(1)}, {selectedLoc.z.toFixed(1)}]</div>
              <div style={{ marginTop: "4px" }}>
                📏 Distance: {Math.round(Math.hypot(playerX - selectedLoc.x, playerZ - selectedLoc.z))} meters
              </div>
            </div>

            {/* Fast Travel Button */}
            <button
              onClick={() => handleFastTravel(selectedLoc)}
              style={{
                marginTop: "auto",
                background: "linear-gradient(135deg, #0284c7, #2563eb)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "15px",
                fontWeight: 800,
                letterSpacing: "0.5px",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(2, 132, 199, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>🚀</span>
              <span>FAST TRAVEL TO DESTINATION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
