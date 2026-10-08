"use client";
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { Net } from "../types/network";
import type { POIDefinition } from "../../shared/protocol";

type HomeKind = "studio" | "flat" | "house" | "penthouse";

/**
 * 3D High-Fidelity Safehouse Loft Interior (GTA San Andreas RP Style):
 * - Chicago Adams Street Penthouse 402:
 *   - Polished hardwood timber flooring with rich varnish sheen.
 *   - Chicago weathered red brick walls, black steel I-beams, industrial pendant lighting.
 *   - Floor-to-ceiling panoramic loft window with Chicago skyscraper skyline view.
 *   - Interactive Swinging Front Door (smoothly animates open / closed).
 *   - King Luxury Bed (Safehouse checkpoint & rest).
 *   - Walk-In Designer Wardrobe (Streetwear outfits & kicks changer).
 *   - Stainless Double-Door Fridge & Kitchenette (Snack refuel).
 *   - Lounge sofa with 65" flat screen TV.
 */
export default function ApartmentInterior({
  net,
  homeKind = "penthouse",
  activePoiId,
  onInteractPoi,
  onOpenWardrobe,
}: {
  net: Net;
  homeKind?: HomeKind;
  activePoiId?: string | null;
  onInteractPoi?: (poiId: string) => void;
  onOpenWardrobe?: () => void;
}) {
  const doorHingeRef = useRef<THREE.Group>(null);
  const curDoorAngle = useRef(0);
  const homeStyle = {
    floor: homeKind === "studio" ? "#77716a" : homeKind === "house" ? "#765238" : "#3b2314",
    wall: homeKind === "penthouse" ? "#7f1d1d" : homeKind === "house" ? "#d6c6a7" : "#b6aa98",
  };

  // Read current player's doorOpen state
  const myPos = net.me ? net.pos.get(net.me) : null;
  const isDoorOpen = !!myPos?.doorOpen;

  useFrame((_, dt) => {
    // Smooth door swinging animation
    const targetAngle = isDoorOpen ? 1.48 : 0; // ~85 degrees open
    curDoorAngle.current = THREE.MathUtils.lerp(
      curDoorAngle.current,
      targetAngle,
      Math.min(1, dt * 7.5)
    );
    if (doorHingeRef.current) {
      doorHingeRef.current.rotation.y = curDoorAngle.current;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ──────────────── 1. ROOM ARCHITECTURE (14m x 10m x 4.2m) ──────────────── */}

      {/* Polished Hardwood Timber Floor */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[14, 0.1, 10]} />
        <meshStandardMaterial
          color={homeStyle.floor}
          roughness={0.35}
          metalness={0.08}
        />
      </mesh>

      {/* High Industrial Loft Ceiling with Dark Timber / Concrete */}
      <mesh position={[0, 4.2, 0]}>
        <boxGeometry args={[14, 0.1, 10]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} />
      </mesh>

      {/* Steel Exposed I-Beams along Ceiling */}
      {[-4, 0, 4].map((x) => (
        <mesh key={`beam-${x}`} position={[x, 4.05, 0]}>
          <boxGeometry args={[0.25, 0.25, 9.9]} />
          <meshStandardMaterial
            color="#09090b"
            roughness={0.4}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* East Wall (Bedroom Wing) - Chicago Red Brick */}
      <mesh receiveShadow position={[6.95, 2.05, 0]}>
        <boxGeometry args={[0.1, 4.2, 10]} />
        <meshStandardMaterial color={homeStyle.wall} roughness={0.85} />
      </mesh>

      {/* West Wall (Kitchen & Wardrobe Wing) - Chicago Brick */}
      <mesh receiveShadow position={[-6.95, 2.05, 0]}>
        <boxGeometry args={[0.1, 4.2, 10]} />
        <meshStandardMaterial color={homeStyle.wall} roughness={0.85} />
      </mesh>

      {/* South Wall (Entrance Doorway Wall) */}
      {/* South Left Wall */}
      <mesh receiveShadow position={[-3.9, 2.05, 4.95]}>
        <boxGeometry args={[6.2, 4.2, 0.1]} />
        <meshStandardMaterial color="#831843" roughness={0.85} />
      </mesh>
      {/* South Right Wall */}
      <mesh receiveShadow position={[3.9, 2.05, 4.95]}>
        <boxGeometry args={[6.2, 4.2, 0.1]} />
        <meshStandardMaterial color="#831843" roughness={0.85} />
      </mesh>
      {/* South Doorway Lintel / Header */}
      <mesh position={[0, 3.4, 4.95]}>
        <boxGeometry args={[1.6, 1.5, 0.1]} />
        <meshStandardMaterial color="#831843" roughness={0.85} />
      </mesh>

      {/* North Wall - Wall Piers & Huge Panoramic Picture Window Frame */}
      <mesh receiveShadow position={[-5.8, 2.05, -4.95]}>
        <boxGeometry args={[2.4, 4.2, 0.1]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.85} />
      </mesh>
      <mesh receiveShadow position={[5.8, 2.05, -4.95]}>
        <boxGeometry args={[2.4, 4.2, 0.1]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.8, -4.95]}>
        <boxGeometry args={[9.2, 0.7, 0.1]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.35, -4.95]}>
        <boxGeometry args={[9.2, 0.7, 0.1]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.85} />
      </mesh>

      {/* Panoramic Window Glass & Black Steel Mullions */}
      <mesh position={[0, 2.05, -4.92]}>
        <planeGeometry args={[9.2, 2.8]} />
        <meshPhysicalMaterial
          color="#93c5fd"
          transparent
          opacity={0.3}
          roughness={0.05}
          metalness={0.1}
          transmission={0.85}
          ior={1.5}
        />
      </mesh>
      {/* Window Vertical Steel Mullions */}
      {[-3, -1, 1, 3].map((mx) => (
        <mesh key={`mull-${mx}`} position={[mx, 2.05, -4.9]}>
          <boxGeometry args={[0.08, 2.8, 0.08]} />
          <meshStandardMaterial
            color="#09090b"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Chicago Skyline Backdrop outside North Window */}
      <group position={[0, 3, -12]}>
        {/* Distant Skyscrapers silhouette with glowing illuminated windows */}
        <mesh position={[-4, 4, 0]}>
          <boxGeometry args={[3, 14, 2]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive="#1e293b"
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh position={[0, 6, -2]}>
          <boxGeometry args={[4, 18, 2.5]} />
          <meshStandardMaterial
            color="#020617"
            emissive="#1e1b4b"
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh position={[4.5, 5, 0]}>
          <boxGeometry args={[3.2, 16, 2]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive="#1e293b"
            emissiveIntensity={0.5}
          />
        </mesh>
        {/* Glowing Antenna Spire */}
        <mesh position={[0, 16.5, -2]}>
          <cylinderGeometry args={[0.08, 0.08, 5, 8]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={1.5}
          />
        </mesh>
      </group>

      {/* ──────────────── 2. INTERACTIVE SWINGING FRONT DOOR ──────────────── */}
      {/* Door Frame */}
      <mesh position={[-0.75, 1.35, 4.95]}>
        <boxGeometry args={[0.1, 2.7, 0.16]} />
        <meshStandardMaterial color="#1e1b18" roughness={0.7} />
      </mesh>
      <mesh position={[0.75, 1.35, 4.95]}>
        <boxGeometry args={[0.1, 2.7, 0.16]} />
        <meshStandardMaterial color="#1e1b18" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.68, 4.95]}>
        <boxGeometry args={[1.6, 0.1, 0.16]} />
        <meshStandardMaterial color="#1e1b18" roughness={0.7} />
      </mesh>

      {/* Swinging Door Leaf (hinged at x = -0.7) */}
      <group position={[-0.7, 0, 4.95]} ref={doorHingeRef}>
        <mesh castShadow receiveShadow position={[0.7, 1.32, 0]}>
          <boxGeometry args={[1.4, 2.62, 0.07]} />
          <meshStandardMaterial color="#451a03" roughness={0.55} />
        </mesh>
        {/* Recessed Door Wood Panels */}
        <mesh position={[0.7, 1.75, 0.04]}>
          <boxGeometry args={[1.1, 0.9, 0.02]} />
          <meshStandardMaterial color="#291102" roughness={0.65} />
        </mesh>
        <mesh position={[0.7, 0.75, 0.04]}>
          <boxGeometry args={[1.1, 0.8, 0.02]} />
          <meshStandardMaterial color="#291102" roughness={0.65} />
        </mesh>
        {/* Polished Brass Door Handle */}
        <mesh position={[1.25, 1.25, 0.06]}>
          <cylinderGeometry args={[0.02, 0.02, 0.14, 12]} />
          <meshStandardMaterial
            color="#fbbf24"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[1.25, 1.25, -0.06]}>
          <cylinderGeometry args={[0.02, 0.02, 0.14, 12]} />
          <meshStandardMaterial
            color="#fbbf24"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Door Proximity Action Prompt */}
      {activePoiId === "apt_door" && (
        <Html position={[0, 2.3, 4.9]} center distanceFactor={8}>
          <div
            onClick={() => onInteractPoi?.("apt_door")}
            style={{
              padding: "6px 14px",
              background: isDoorOpen
                ? "linear-gradient(135deg, #16a34a, #15803d)"
                : "linear-gradient(135deg, #dc2626, #b91c1c)",
              border: "1.5px solid #ffffff",
              borderRadius: "20px",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 800,
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
              cursor: "pointer",
            }}
          >
            {isDoorOpen ? "🚪 [E] CLOSE DOOR" : "🔓 [E] OPEN DOOR"}
          </div>
        </Html>
      )}

      {/* Exit to Street Prompt */}
      {activePoiId === "apt_exit" && (
        <Html position={[0, 1.6, 4.3]} center distanceFactor={8}>
          <div
            onClick={() => onInteractPoi?.("apt_exit")}
            style={{
              padding: "6px 14px",
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              border: "1.5px solid #7dd3fc",
              borderRadius: "20px",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 800,
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
              cursor: "pointer",
            }}
          >
            🏙️ [F / E] STEP OUT TO STREET
          </div>
        </Html>
      )}

      {/* ──────────────── 3. KING LUXURY BED (REST & HEALTH) ──────────────── */}
      <group position={[5.2, 0, -3.2]}>
        {/* Bed Headboard */}
        <mesh position={[0, 1.1, -1.35]} castShadow>
          <boxGeometry args={[2.5, 1.5, 0.15]} />
          <meshStandardMaterial color="#1e1b18" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.1, -1.26]}>
          <boxGeometry args={[2.3, 1.3, 0.05]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Bed Wooden Base Frame */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.35, 2.6]} />
          <meshStandardMaterial color="#1e1b18" roughness={0.7} />
        </mesh>

        {/* Thick White Mattress */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.25, 0.3, 2.45]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>

        {/* Navy Blue Velvet Folded Duvet / Blanket */}
        <mesh position={[0, 0.58, 0.3]} castShadow>
          <boxGeometry args={[2.28, 0.18, 1.7]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.75} />
        </mesh>
        {/* Folded Sheet Accent */}
        <mesh position={[0, 0.59, -0.54]}>
          <boxGeometry args={[2.28, 0.14, 0.2]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
        </mesh>

        {/* Dual Fluffy Pillows */}
        <mesh position={[-0.6, 0.72, -0.92]} castShadow rotation-x={0.15}>
          <boxGeometry args={[0.82, 0.16, 0.5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.85} />
        </mesh>
        <mesh position={[0.6, 0.72, -0.92]} castShadow rotation-x={0.15}>
          <boxGeometry args={[0.82, 0.16, 0.5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.85} />
        </mesh>

        {/* Bedside Nightstand Left */}
        <mesh position={[-1.6, 0.3, -1.1]} castShadow>
          <boxGeometry args={[0.6, 0.6, 0.5]} />
          <meshStandardMaterial color="#1e1b18" roughness={0.65} />
        </mesh>
        {/* Bedside Nightstand Lamp */}
        <mesh position={[-1.6, 0.72, -1.1]}>
          <cylinderGeometry args={[0.15, 0.2, 0.26, 16]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fde047"
            emissiveIntensity={0.8}
            roughness={0.4}
          />
        </mesh>
        <pointLight
          position={[-1.6, 0.9, -1.1]}
          intensity={2.2}
          distance={5}
          color="#fef08a"
        />

        {/* Bed Proximity Action Prompt */}
        {activePoiId === "apt_bed" && (
          <Html position={[0, 1.6, 0]} center distanceFactor={8}>
            <div
              onClick={() => onInteractPoi?.("apt_bed")}
              style={{
                padding: "6px 14px",
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                border: "1.5px solid #ddd6fe",
                borderRadius: "20px",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 800,
                fontFamily: "system-ui, sans-serif",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 16px rgba(139, 92, 246, 0.6)",
                cursor: "pointer",
              }}
            >
              🛏️ [E] SLEEP IN BED · REST & HEAL
            </div>
          </Html>
        )}
      </group>

      {/* ──────────────── 4. WALK-IN CLOTHING WARDROBE ──────────────── */}
      <group position={[-5.2, 0, -3.2]}>
        {/* Wardrobe Back Cabinet */}
        <mesh position={[0, 1.5, -1.35]} castShadow>
          <boxGeometry args={[2.8, 3.0, 0.2]} />
          <meshStandardMaterial color="#262626" roughness={0.6} />
        </mesh>
        {/* Side Panels */}
        <mesh position={[-1.35, 1.5, -0.65]} castShadow>
          <boxGeometry args={[0.1, 3.0, 1.4]} />
          <meshStandardMaterial color="#262626" roughness={0.6} />
        </mesh>
        <mesh position={[1.35, 1.5, -0.65]} castShadow>
          <boxGeometry args={[0.1, 3.0, 1.4]} />
          <meshStandardMaterial color="#262626" roughness={0.6} />
        </mesh>
        {/* Top Shelf */}
        <mesh position={[0, 2.85, -0.65]}>
          <boxGeometry args={[2.7, 0.08, 1.4]} />
          <meshStandardMaterial color="#262626" roughness={0.6} />
        </mesh>

        {/* Clothes Hanging Rail */}
        <mesh position={[0, 2.2, -0.6]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.02, 0.02, 2.6, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Hanging Jackets / Hoodies */}
        {[
          { x: -0.9, color: "#dc2626" }, // Red Bulls
          { x: -0.5, color: "#09090b" }, // Black Leather
          { x: -0.1, color: "#2563eb" }, // Blue Bomber
          { x: 0.3, color: "#16a34a" },  // Olive Cargo
          { x: 0.7, color: "#facc15" },  // Gold Tracksuit
        ].map((item, idx) => (
          <group key={`coat-${idx}`} position={[item.x, 1.7, -0.6]}>
            <mesh castShadow>
              <boxGeometry args={[0.22, 0.8, 0.35]} />
              <meshStandardMaterial color={item.color} roughness={0.7} />
            </mesh>
            {/* Hanger Hook */}
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.12, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Sneaker Shoe Racks (Bottom Shelves) */}
        <mesh position={[0, 0.6, -0.65]}>
          <boxGeometry args={[2.7, 0.06, 1.3]} />
          <meshStandardMaterial color="#171717" roughness={0.7} />
        </mesh>
        {/* Miniature Shoe Models */}
        {[-0.8, -0.3, 0.2, 0.7].map((sx, idx) => (
          <mesh key={`shoe-${idx}`} position={[sx, 0.72, -0.65]} castShadow>
            <boxGeometry args={[0.28, 0.14, 0.45]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? "#ffffff" : "#dc2626"}
              roughness={0.5}
            />
          </mesh>
        ))}

        {/* Full Length Dressing Mirror on the side */}
        <mesh position={[1.42, 1.5, -0.4]}>
          <boxGeometry args={[0.02, 2.2, 0.8]} />
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.98}
            roughness={0.05}
          />
        </mesh>

        {/* Wardrobe Proximity Action Prompt */}
        {activePoiId === "apt_wardrobe" && (
          <Html position={[0, 1.6, -0.2]} center distanceFactor={8}>
            <div
              onClick={() => onOpenWardrobe?.()}
              style={{
                padding: "6px 14px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "1.5px solid #fef08a",
                borderRadius: "20px",
                color: "#000000",
                fontSize: "12px",
                fontWeight: 900,
                fontFamily: "system-ui, sans-serif",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 16px rgba(245, 158, 11, 0.7)",
                cursor: "pointer",
              }}
            >
              👔 [E] OPEN WARDROBE · CHANGE OUTFIT
            </div>
          </Html>
        )}
      </group>

      {/* ──────────────── 5. MODERN KITCHEN ISLAND & STAINLESS FRIDGE ──────────────── */}
      <group position={[-5.2, 0, 2.8]}>
        {/* Double-Door Stainless Refrigerator */}
        <group position={[-1.0, 1.25, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.9, 2.5, 0.9]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.88}
              roughness={0.18}
            />
          </mesh>
          {/* Vertical Door Handles */}
          <mesh position={[0.42, 0.3, 0.48]}>
            <cylinderGeometry args={[0.015, 0.015, 0.8, 12]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0.42, -0.5, 0.48]}>
            <cylinderGeometry args={[0.015, 0.015, 0.6, 12]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          {/* Digital Dispenser Touch Screen */}
          <mesh position={[0.2, 0.4, 0.46]}>
            <boxGeometry args={[0.2, 0.3, 0.02]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#38bdf8"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>

        {/* Kitchen Marble Counter Island */}
        <mesh position={[0.5, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.1, 1.8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Dark Timber Base */}
        <mesh position={[0.5, 0.45, 0]}>
          <boxGeometry args={[1.4, 0.9, 1.7]} />
          <meshStandardMaterial color="#1e1b18" roughness={0.7} />
        </mesh>

        {/* Modern Barstools */}
        {[-0.5, 0.5].map((bz) => (
          <group key={`stool-${bz}`} position={[1.5, 0, bz]}>
            <mesh position={[0, 0.72, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.24, 0.06, 16]} />
              <meshStandardMaterial color="#09090b" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.36, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.72, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* Fridge Proximity Prompt */}
        {activePoiId === "apt_fridge" && (
          <Html position={[-0.5, 1.6, 0.5]} center distanceFactor={8}>
            <div
              onClick={() => onInteractPoi?.("apt_fridge")}
              style={{
                padding: "6px 14px",
                background: "linear-gradient(135deg, #0284c7, #0369a1)",
                border: "1.5px solid #7dd3fc",
                borderRadius: "20px",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 800,
                fontFamily: "system-ui, sans-serif",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 16px rgba(2, 132, 199, 0.6)",
                cursor: "pointer",
              }}
            >
              🥤 [E] OPEN FRIDGE · REFUEL SODA
            </div>
          </Html>
        )}
      </group>

      {/* ──────────────── 6. LIVING ROOM LOUNGE & 65" 4K TV ──────────────── */}
      <group position={[1.2, 0, -0.6]}>
        {/* L-Shaped Sectional Modern Couch */}
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.5, 1.2]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[1.0, 0.4, 0.9]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.5, 1.0]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* Couch Backrest */}
        <mesh position={[0, 0.75, -0.5]} castShadow>
          <boxGeometry args={[2.8, 0.6, 0.25]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>

        {/* Coffee Table with Glass Top */}
        <mesh position={[0, 0.25, 1.4]} castShadow>
          <boxGeometry args={[1.4, 0.35, 0.8]} />
          <meshStandardMaterial color="#09090b" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.44, 1.4]}>
          <boxGeometry args={[1.44, 0.03, 0.84]} />
          <meshPhysicalMaterial
            color="#93c5fd"
            transparent
            opacity={0.5}
            roughness={0.1}
            transmission={0.9}
          />
        </mesh>

        {/* 65" Flat Screen TV on Wall */}
        <group position={[0, 1.8, 3.2]} rotation-y={Math.PI}>
          <mesh castShadow>
            <boxGeometry args={[2.2, 1.25, 0.08]} />
            <meshStandardMaterial color="#09090b" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Glowing Chicago RP TV Screen */}
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[2.1, 1.15]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#0284c7"
              emissiveIntensity={0.65}
              roughness={0.1}
            />
          </mesh>
          <pointLight
            position={[0, 0, 0.5]}
            color="#38bdf8"
            intensity={1.8}
            distance={5}
          />
        </group>
      </group>

      {/* ──────────────── 7. NEON WALL ART & AMBIENT INTERIOR LIGHTING ──────────────── */}
      {/* Chicago Neon Sign on Brick Wall */}
      <group position={[0, 3.2, -4.85]}>
        <mesh>
          <boxGeometry args={[3.2, 0.6, 0.05]} />
          <meshStandardMaterial
            color="#09090b"
            emissive="#ef4444"
            emissiveIntensity={0.8}
            roughness={0.3}
          />
        </mesh>
        <pointLight
          position={[0, 0, 0.4]}
          color="#ef4444"
          intensity={2.0}
          distance={6}
        />
      </group>

      {/* Industrial Ceiling Spotlights */}
      <pointLight position={[0, 3.8, 0]} intensity={3.0} distance={14} color="#fffbeb" />
      <pointLight position={[-4, 3.6, 2]} intensity={2.2} distance={9} color="#fef3c7" />
      <pointLight position={[4, 3.6, 2]} intensity={2.2} distance={9} color="#fef3c7" />
    </group>
  );
}
