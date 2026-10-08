"use client";
import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { Net } from "../types/network";
import { MSG } from "../../shared/protocol";
import HumanoidNPC from "./HumanoidNPC";

export default function MallInterior({
  net,
  activePoiId,
  onInteractPoi,
  onExitMall,
  onWorkShift,
  onStudyCollege,
}: {
  net: Net;
  activePoiId?: string | null;
  onInteractPoi?: (poiId: string) => void;
  onExitMall?: () => void;
  onWorkShift?: () => void;
  onStudyCollege?: () => void;
}) {
  const pillars = useMemo(
    () => [
      { x: -9, z: -6 },
      { x: 9, z: -6 },
      { x: -9, z: 4 },
      { x: 9, z: 4 },
    ],
    []
  );

  return (
    <group>
      {/* ══════════════════════════════════════════════════════════════════════
          1. POLISHED CALACATTA MARBLE FLOOR & MEZZANINE BALCONIES
      ══════════════════════════════════════════════════════════════════════ */}
      {/* Ground Level Marble Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[36, 32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.12} metalness={0.1} />
      </mesh>

      {/* Geometric Decorative Marble Inlay Medallions */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]} receiveShadow>
        <ringGeometry args={[5.2, 5.8, 48]} />
        <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 0]} receiveShadow>
        <ringGeometry args={[2.5, 2.7, 48]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* 2nd-Floor Mezzanine Promenade Balcony (Upper Level) */}
      {/* North Mezzanine Overlook */}
      <group position={[0, 5.2, -11]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[34, 0.4, 4.5]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
        </mesh>
        {/* Tempered Glass Railing */}
        <mesh position={[0, 0.7, 2.2]}>
          <boxGeometry args={[34, 1.0, 0.08]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} transparent opacity={0.35} />
        </mesh>
        {/* Polished Stainless Steel Handrail */}
        <mesh position={[0, 1.22, 2.2]}>
          <boxGeometry args={[34, 0.06, 0.12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* West Mezzanine Wing */}
      <group position={[-14.5, 5.2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.4, 20]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
        </mesh>
        <mesh position={[1.55, 0.7, 0]}>
          <boxGeometry args={[0.08, 1.0, 20]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} transparent opacity={0.35} />
        </mesh>
        <mesh position={[1.55, 1.22, 0]}>
          <boxGeometry args={[0.12, 0.06, 20]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* East Mezzanine Wing */}
      <group position={[14.5, 5.2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.4, 20]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
        </mesh>
        <mesh position={[-1.55, 0.7, 0]}>
          <boxGeometry args={[0.08, 1.0, 20]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} transparent opacity={0.35} />
        </mesh>
        <mesh position={[-1.55, 1.22, 0]}>
          <boxGeometry args={[0.12, 0.06, 20]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          2. PERIMETER MALL WALLS & 4-STORY GLASS SKYLIGHT ROOF
      ══════════════════════════════════════════════════════════════════════ */}
      {/* North Wall */}
      <mesh position={[0, 6, -15]} receiveShadow>
        <boxGeometry args={[36, 12, 0.6]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      {/* South Wall (Front Facade) */}
      <mesh position={[0, 6, 15]} receiveShadow>
        <boxGeometry args={[36, 12, 0.6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
      {/* West Wall */}
      <mesh position={[-17.5, 6, 0]} receiveShadow>
        <boxGeometry args={[0.6, 12, 30]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
      </mesh>
      {/* East Wall */}
      <mesh position={[17.5, 6, 0]} receiveShadow>
        <boxGeometry args={[0.6, 12, 30]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
      </mesh>

      {/* 4-Story Glass Skylight & Steel Architectural Space-Frame */}
      <mesh position={[0, 11.8, 0]}>
        <boxGeometry args={[34, 0.25, 28]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.08} metalness={0.85} transparent opacity={0.32} />
      </mesh>
      {[-9, -3, 3, 9].map((x) => (
        <mesh key={`truss_${x}`} position={[x, 11.5, 0]}>
          <boxGeometry args={[0.45, 0.5, 28]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {/* Grand Architectural Columns with Gold Capitals */}
      {pillars.map((pos, idx) => (
        <group key={`col_${idx}`} position={[pos.x, 5.8, pos.z]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.7, 0.7, 11.6, 20]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
          </mesh>
          <mesh position={[0, 5.6, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 0.45, 20]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ══════════════════════════════════════════════════════════════════════
          3. GRAND CENTRAL ATRIUM WATER FOUNTAIN (Center Z: 0)
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[0, 0, 0]}>
        {/* Outer Granite Basin Pool */}
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.8, 3.0, 0.7, 32]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Pool Water Surface */}
        <mesh position={[0, 0.62, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[2.65, 32]} />
          <meshStandardMaterial color="#0284c7" roughness={0.05} metalness={0.4} transparent opacity={0.85} />
        </mesh>
        {/* Tiered Center Fountain Pedestal */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.9, 1.1, 0.9, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[1.4, 0.4, 0.4, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
        {/* Vertical Water Jet Spray */}
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.08, 0.22, 1.2, 12]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.1} transparent opacity={0.7} />
        </mesh>
        <pointLight position={[0, 0.8, 0]} intensity={1.5} color="#38bdf8" distance={6} />
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          4. CENTRAL RECEPTION & CONCIERGE INFORMATION DESK (Center Z: 5.5)
             FEATURING ANATOMICAL HUMANOID RECEPTIONIST NPC
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[0, 0, 5.5]}>
        {/* Curved Architectural Quartz Reception Counter */}
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.4, 2.4, 1.1, 28, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <cylinderGeometry args={[2.55, 2.55, 0.08, 28, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.2} />
        </mesh>

        {/* Dual Receptionist Terminal Workstations */}
        <mesh position={[-0.7, 1.35, 0.4]}>
          <boxGeometry args={[0.65, 0.42, 0.05]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.7, 1.35, 0.4]}>
          <boxGeometry args={[0.65, 0.42, 0.05]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.5} />
        </mesh>

        {/* 💁‍♀️ ANATOMICAL RECEPTIONIST NPC (Chic Bun, Navy Blazer, Gold Badge, Typing) */}
        <HumanoidNPC
          position={[0, 0, 0.25]}
          gender="female"
          skinTone="#fcd34d"
          hairColor="#3f2e22"
          hairStyle="bun"
          topType="blazer"
          topColor="#1e3a8a"
          innerColor="#ffffff"
          bottomColor="#1e293b"
          shoeColor="#0f172a"
          accessory="name_tag"
          pose="typing"
        />

        {/* Interactive Concierge Dialogue Prompt */}
        <Html position={[0, 2.3, 0.2]} center distanceFactor={14}>
          <div
            onClick={() => {
              net.room?.send(MSG.toast, {
                text: "💁‍♀️ Concierge Emily: 'Welcome to Block 37 Mega Mall! Food Court & Pizza on West, Tech Vault & Sneaker Vault on East, Restrooms down the corridor. Let me know if you need assistance!'",
                type: "info",
              });
            }}
            style={{
              background: "rgba(15, 23, 42, 0.95)",
              border: "1.5px solid #38bdf8",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 18px rgba(56, 189, 248, 0.45)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>💁‍♀️</span>
            <span>Concierge Emily: Mall Information Desk [E]</span>
          </div>
        </Html>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          5. TOUCHSCREEN DIGITAL WAYFINDING DIRECTORY KIOSK (Z: 8.5)
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[0, 0, 8.5]}>
        {/* Sleek Modern Pedestal */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[0.9, 2.2, 0.35]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Glowing Touchscreen Display */}
        <mesh position={[0, 1.35, 0.18]} rotation={[-0.15, 0, 0]}>
          <planeGeometry args={[0.8, 1.2]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} />
        </mesh>
        <Html position={[0, 2.4, 0]} center distanceFactor={12}>
          <button
            onClick={() => {
              net.room?.send(MSG.toast, {
                text: "🗺️ Digital Directory: L1 - Giordano's Pizza | L1 - Intelligentsia Coffee | L1 - Flight Club | L2 - Apple Vault | L2 - Restrooms & Elevators",
                type: "info",
              });
            }}
            style={{
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              color: "#ffffff",
              border: "1.5px solid #38bdf8",
              borderRadius: "8px",
              padding: "5px 12px",
              fontWeight: 800,
              fontSize: "11px",
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(2, 132, 199, 0.5)",
              whiteSpace: "nowrap",
            }}
          >
            🗺️ Interactive Store Directory & Floor Plan [E]
          </button>
        </Html>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          6. REAL VENDING MACHINE ARCADE BANK (West Wall, X: -16.2, Z: -2)
             WITH WORKING DISPENSERS AND CHASE BANK ATM
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[-16.2, 0, -2]} rotation={[0, Math.PI / 2, 0]}>
        {/* Machine 1: Chicago Cold Soda Vending Machine */}
        <group position={[-2.4, 0, 0]}>
          <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 2.5, 0.95]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Illuminated Glass Display */}
          <mesh position={[0, 1.5, 0.48]}>
            <boxGeometry args={[1.0, 1.2, 0.04]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.65} />
          </mesh>
          {/* Drink Can Rows */}
          {[-0.35, 0, 0.35].map((cx, i) => (
            <mesh key={`can_${i}`} position={[cx, 1.5, 0.45]}>
              <cylinderGeometry args={[0.07, 0.07, 0.22, 10]} />
              <meshStandardMaterial color={i === 0 ? "#ef4444" : i === 1 ? "#3b82f6" : "#22c55e"} />
            </mesh>
          ))}
          {/* Bottom Dispense Push Door */}
          <mesh position={[0, 0.35, 0.48]}>
            <boxGeometry args={[0.7, 0.35, 0.03]} />
            <meshStandardMaterial color="#18181b" metalness={0.8} />
          </mesh>
          <Html position={[0, 2.7, 0]} center distanceFactor={12}>
            <button
              onClick={() => net.room?.send(MSG.drink_beverage)}
              style={{
                background: "linear-gradient(135deg, #0284c7, #2563eb)",
                color: "#fff",
                border: "1.5px solid #38bdf8",
                borderRadius: "8px",
                padding: "5px 12px",
                fontWeight: 800,
                fontSize: "11px",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                whiteSpace: "nowrap",
              }}
            >
              🥤 Soda Machine: Buy Ice Cold Soda (-$5) [E]
            </button>
          </Html>
        </group>

        {/* Machine 2: Snack & Candy Vending Machine */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 2.5, 0.95]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 1.5, 0.48]}>
            <boxGeometry args={[1.0, 1.2, 0.04]} />
            <meshStandardMaterial color="#fef08a" emissive="#ca8a04" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0.35, 0.48]}>
            <boxGeometry args={[0.7, 0.35, 0.03]} />
            <meshStandardMaterial color="#09090b" metalness={0.8} />
          </mesh>
          <Html position={[0, 2.7, 0]} center distanceFactor={12}>
            <button
              onClick={() => net.room?.send(MSG.eat_food)}
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff",
                border: "1.5px solid #fef08a",
                borderRadius: "8px",
                padding: "5px 12px",
                fontWeight: 800,
                fontSize: "11px",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                whiteSpace: "nowrap",
              }}
            >
              🍫 Snack Machine: Buy Chips & Candy (-$12) [E]
            </button>
          </Html>
        </group>

        {/* Machine 3: Chase Bank ATM Kiosk */}
        <group position={[2.2, 0, 0]}>
          <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.0, 2.4, 0.9]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.55, 0.46]}>
            <boxGeometry args={[0.7, 0.55, 0.02]} />
            <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.6} />
          </mesh>
          {/* ATM Keypad & Card Reader Slot */}
          <mesh position={[0, 1.15, 0.47]}>
            <boxGeometry args={[0.4, 0.25, 0.04]} />
            <meshStandardMaterial color="#09090b" metalness={0.8} />
          </mesh>
          <Html position={[0, 2.65, 0]} center distanceFactor={12}>
            <button
              onClick={() => {
                net.room?.send(MSG.toast, {
                  text: "🏧 Chase ATM: Account verified. Secure cash withdrawal ready.",
                  type: "info",
                });
              }}
              style={{
                background: "linear-gradient(135deg, #0284c7, #0369a1)",
                color: "#fff",
                border: "1.5px solid #67e8f9",
                borderRadius: "8px",
                padding: "5px 12px",
                fontWeight: 800,
                fontSize: "11px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              🏧 Chase Bank ATM: Withdraw Cash [E]
            </button>
          </Html>
        </group>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          7. STORE 1: GIORDANO'S FAMOUS PIZZA RESTAURANT (-X, Z: -9)
             DOORS: DOUBLE GLASS ALUMINUM RESTAURANT DOORS
             SELLER: ANATOMICAL CHEF SELLER NPC (TOQUE, APRON, TONGS)
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[-10, 0, -9]}>
        {/* Storefront Glass Wall */}
        <mesh position={[0, 2.0, 2.2]}>
          <boxGeometry args={[9.5, 4.0, 0.1]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.25} />
        </mesh>

        {/* 🚪 GIORDANO'S DOUBLE ENTRANCE DOORS */}
        <group position={[3.2, 0, 2.2]}>
          {/* Aluminum Door Frame */}
          <mesh position={[0, 1.7, 0]}>
            <boxGeometry args={[2.2, 3.4, 0.18]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Left Door Leaf */}
          <mesh position={[-0.52, 1.65, 0]}>
            <boxGeometry args={[0.96, 3.1, 0.08]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.4} />
          </mesh>
          {/* Right Door Leaf */}
          <mesh position={[0.52, 1.65, 0]}>
            <boxGeometry args={[0.96, 3.1, 0.08]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.4} />
          </mesh>
          {/* Vertical Pull Handles */}
          <mesh position={[-0.15, 1.6, 0.08]}>
            <cylinderGeometry args={[0.02, 0.02, 1.0, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
          <mesh position={[0.15, 1.6, 0.08]}>
            <cylinderGeometry args={[0.02, 0.02, 1.0, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
          {/* Door Sign */}
          <Html position={[0, 3.2, 0]} center distanceFactor={10}>
            <div style={{ background: "#dc2626", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800 }}>
              🚪 RESTAURANT ENTRY
            </div>
          </Html>
        </group>

        {/* Counter & Pizza Warmers */}
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[7.2, 1.1, 1.8]} />
          <meshStandardMaterial color="#991b1b" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.15, 0]} receiveShadow>
          <boxGeometry args={[7.4, 0.1, 2.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.3} />
        </mesh>
        {/* Deep Dish Pizza Displays */}
        {[-1.8, 0, 1.8].map((px, idx) => (
          <mesh key={`pizza_pan_${idx}`} position={[px, 1.25, 0]} rotation-x={-Math.PI / 2}>
            <cylinderGeometry args={[0.35, 0.35, 0.08, 20]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.6} />
          </mesh>
        ))}

        {/* 👨‍🍳 ANATOMICAL PIZZA CHEF & SELLER NPC */}
        <HumanoidNPC
          position={[0, 0, -0.6]}
          gender="male"
          skinTone="#fcd34d"
          hairColor="#451a03"
          hairStyle="chef_hat"
          topType="chef"
          topColor="#ffffff"
          bottomColor="#1e293b"
          shoeColor="#09090b"
          pose="serving"
        />

        {/* Store Banner */}
        <Html position={[0, 4.4, 0]} center distanceFactor={14}>
          <div style={{ background: "#dc2626", color: "#fff", padding: "6px 18px", borderRadius: "8px", fontWeight: 900, fontSize: "13px", whiteSpace: "nowrap", border: "2px solid #fef08a", boxShadow: "0 4px 14px rgba(0,0,0,0.6)" }}>
            🍕 GIORDANO'S WORLD FAMOUS PIZZA · CASHIER SELLER
          </div>
        </Html>

        {/* Order Button */}
        <Html position={[0, 1.9, 0]} center distanceFactor={12}>
          <button
            onClick={() => onInteractPoi?.("mall_foodcourt_pizza")}
            style={{
              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
              color: "#fff",
              border: "1.5px solid #fef08a",
              borderRadius: "10px",
              padding: "7px 18px",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>👨‍🍳</span>
            <span>Order Chicago Deep Dish from Chef (-$12)</span>
          </button>
        </Html>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          8. STORE 2: FLIGHT CLUB CHICAGO SNEAKER VAULT (+X, Z: -9)
             DOORS: FRAMELESS TEMPERED GLASS SLIDING DOORS
             SELLER: ANATOMICAL BOUTIQUE SELLER NPC (HOODIE, GOLD CHAIN, CLIPBOARD)
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[10, 0, -9]}>
        <mesh position={[0, 2.0, 2.2]}>
          <boxGeometry args={[9.5, 4.0, 0.1]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.25} />
        </mesh>

        {/* 🚪 FLIGHT CLUB SLIDING GLASS ENTRANCE DOORS */}
        <group position={[-3.2, 0, 2.2]}>
          <mesh position={[0, 1.7, 0]}>
            <boxGeometry args={[2.2, 3.4, 0.18]} />
            <meshStandardMaterial color="#09090b" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-0.5, 1.65, 0]}>
            <boxGeometry args={[0.98, 3.1, 0.08]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.4} />
          </mesh>
          <mesh position={[0.5, 1.65, 0]}>
            <boxGeometry args={[0.98, 3.1, 0.08]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.4} />
          </mesh>
          <Html position={[0, 3.2, 0]} center distanceFactor={10}>
            <div style={{ background: "#0f172a", border: "1px solid #38bdf8", color: "#38bdf8", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800 }}>
              🚪 STORE ENTRY
            </div>
          </Html>
        </group>

        {/* Sneaker Display Shelves */}
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[7, 1.1, 1.6]} />
          <meshStandardMaterial color="#09090b" roughness={0.2} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[6.6, 0.8, 1.2]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.35} />
        </mesh>

        {/* 👟 ANATOMICAL BOUTIQUE SELLER NPC */}
        <HumanoidNPC
          position={[0, 0, -0.6]}
          gender="male"
          skinTone="#d49b72"
          hairColor="#18181b"
          hairStyle="fade"
          topType="tshirt"
          topColor="#09090b"
          bottomColor="#334155"
          shoeColor="#f8fafc"
          accessory="chain"
          pose="standing"
        />

        {/* Store Banner */}
        <Html position={[0, 4.4, 0]} center distanceFactor={14}>
          <div style={{ background: "#0f172a", border: "1.5px solid #38bdf8", color: "#38bdf8", padding: "6px 18px", borderRadius: "8px", fontWeight: 900, fontSize: "13px", whiteSpace: "nowrap" }}>
            👟 FLIGHT CLUB CHICAGO · SNEAKER VAULT SELLER
          </div>
        </Html>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          9. KIOSK 1: INTELLIGENTSIA CHICAGO COFFEE KIOSK (Z: 2.2, X: -4.5)
             SELLER: ANATOMICAL BARISTA SELLER NPC (GREEN APRON & COFFEE CUP)
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[-4.5, 0, 2.2]}>
        {/* Island Counter */}
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 1.1, 1.8]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[3.4, 0.08, 2.0]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Espresso Machine */}
        <mesh position={[-0.8, 1.45, 0]}>
          <boxGeometry args={[0.9, 0.6, 0.6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* ☕ ANATOMICAL BARISTA SELLER NPC */}
        <HumanoidNPC
          position={[0.5, 0, -0.4]}
          gender="female"
          skinTone="#fcd34d"
          hairColor="#1e1e24"
          hairStyle="fade"
          topType="apron"
          topColor="#1c1917"
          innerColor="#ffffff"
          bottomColor="#1e293b"
          shoeColor="#ffffff"
          accessory="coffee_cup"
          pose="holding_item"
        />

        <Html position={[0, 2.3, 0]} center distanceFactor={12}>
          <button
            onClick={() => {
              net.room?.send(MSG.drink_beverage);
              net.room?.send(MSG.toast, {
                text: "☕ Barista Sarah: Handcrafted Chicago Pour-Over Coffee served! Energy +35, Hydration +20.",
                type: "info",
              });
            }}
            style={{
              background: "linear-gradient(135deg, #047857, #065f46)",
              color: "#fff",
              border: "1.5px solid #6ee7b7",
              borderRadius: "8px",
              padding: "5px 14px",
              fontWeight: 800,
              fontSize: "11px",
              cursor: "pointer",
              boxShadow: "0 3px 12px rgba(4, 120, 87, 0.5)",
              whiteSpace: "nowrap",
            }}
          >
            ☕ Intelligentsia Coffee: Buy Handcrafted Latte (-$6) [E]
          </button>
        </Html>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          10. KIOSK 2: APPLE TECH VAULT & GENIUS BAR (Z: 2.2, X: 4.5)
              SELLER: ANATOMICAL TECH SPECIALIST NPC (BLUE TEE, IPAD, GLASSES)
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[4.5, 0, 2.2]}>
        {/* Solid White Corian Demo Table */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 1.0, 1.6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Demo MacBooks & iPads */}
        <mesh position={[-0.7, 1.05, 0]}>
          <boxGeometry args={[0.5, 0.04, 0.35]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.7, 1.05, 0]}>
          <boxGeometry args={[0.5, 0.04, 0.35]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* 💻 ANATOMICAL TECH SPECIALIST SELLER NPC */}
        <HumanoidNPC
          position={[0, 0, -0.4]}
          gender="male"
          skinTone="#d49b72"
          hairColor="#27272a"
          hairStyle="slick"
          topType="tshirt"
          topColor="#0284c7"
          bottomColor="#1e293b"
          shoeColor="#ffffff"
          accessory="ipad"
          pose="holding_item"
        />

        <Html position={[0, 2.3, 0]} center distanceFactor={12}>
          <button
            onClick={() => {
              net.room?.send(MSG.toast, {
                text: "💻 Tech Specialist Leo: 'Welcome to Apple! Let me know if you want to test the new M3 MacBook or iPhone 16 Pro!'",
                type: "info",
              });
            }}
            style={{
              background: "linear-gradient(135deg, #0f172a, #1e293b)",
              color: "#38bdf8",
              border: "1.5px solid #38bdf8",
              borderRadius: "8px",
              padding: "5px 14px",
              fontWeight: 800,
              fontSize: "11px",
              cursor: "pointer",
              boxShadow: "0 3px 12px rgba(15, 23, 42, 0.6)",
              whiteSpace: "nowrap",
            }}
          >
            💻 Apple Tech Hub: Consult with Tech Specialist [E]
          </button>
        </Html>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          11. STORE 3: CORPORATE OFFICES WITH DOUBLE FROSTED DOORS (-X, Z: -0.5)
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[-10, 0, -0.5]}>
        <mesh position={[0, 2.0, -2.6]} receiveShadow>
          <boxGeometry args={[8.5, 4.0, 0.15]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} transparent opacity={0.8} />
        </mesh>

        {/* 🚪 DOUBLE FROSTED GLASS EXECUTIVE DOORS */}
        <group position={[0, 0, -2.6]}>
          <mesh position={[0, 1.7, 0]}>
            <boxGeometry args={[2.6, 3.4, 0.2]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[-0.6, 1.65, 0]}>
            <boxGeometry args={[1.15, 3.1, 0.1]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.5} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0.6, 1.65, 0]}>
            <boxGeometry args={[1.15, 3.1, 0.1]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.5} transparent opacity={0.85} />
          </mesh>
          {/* Brushed Stainless Pull Handles */}
          <mesh position={[-0.15, 1.6, 0.1]}>
            <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
          <mesh position={[0.15, 1.6, 0.1]}>
            <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
          <Html position={[0, 3.2, 0]} center distanceFactor={10}>
            <div style={{ background: "#0284c7", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800 }}>
              🚪 EXECUTIVE OFFICES
            </div>
          </Html>
        </group>

        {/* Workstation Desks */}
        <mesh position={[-1.8, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.85, 1.4]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[1.8, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.85, 1.4]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.2} />
        </mesh>

        <Html position={[0, 1.8, 0]} center distanceFactor={12}>
          <button
            onClick={() => onWorkShift?.()}
            style={{
              background: "linear-gradient(135deg, #0284c7, #1d4ed8)",
              color: "#fff",
              border: "1.5px solid #38bdf8",
              borderRadius: "10px",
              padding: "7px 18px",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>💼</span>
            <span>Work Corporate Shift (+$220)</span>
          </button>
        </Html>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          12. STORE 4: COLLEGE LECTURE HALL WITH MAHOGANY CLASSROOM DOOR (+X, Z: -0.5)
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[10, 0, -0.5]}>
        <mesh position={[0, 2.0, -2.6]} receiveShadow>
          <boxGeometry args={[8.5, 4.0, 0.15]} />
          <meshStandardMaterial color="#064e3b" roughness={0.8} />
        </mesh>

        {/* 🚪 SOLID MAHOGANY CLASSROOM DOOR WITH GLASS VISION WINDOW */}
        <group position={[3.2, 0, -2.6]}>
          <mesh position={[0, 1.7, 0]}>
            <boxGeometry args={[2.0, 3.4, 0.18]} />
            <meshStandardMaterial color="#451a03" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.65, 0]}>
            <boxGeometry args={[1.8, 3.1, 0.12]} />
            <meshStandardMaterial color="#78350f" roughness={0.6} />
          </mesh>
          {/* Wired Glass Window */}
          <mesh position={[0, 2.2, 0.08]}>
            <boxGeometry args={[0.5, 0.8, 0.04]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.5} />
          </mesh>
          {/* Lever Handle */}
          <mesh position={[-0.7, 1.5, 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
          <Html position={[0, 3.2, 0]} center distanceFactor={10}>
            <div style={{ background: "#059669", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800 }}>
              🚪 LECTURE HALL 101
            </div>
          </Html>
        </group>

        {/* Tiered Class Desks */}
        <mesh position={[0, 0.45, 0.4]} castShadow receiveShadow>
          <boxGeometry args={[6.8, 0.85, 0.7]} />
          <meshStandardMaterial color="#92400e" roughness={0.5} />
        </mesh>

        <Html position={[0, 1.8, -1.0]} center distanceFactor={12}>
          <button
            onClick={() => onStudyCollege?.()}
            style={{
              background: "linear-gradient(135deg, #059669, #047857)",
              color: "#fff",
              border: "1.5px solid #6ee7b7",
              borderRadius: "10px",
              padding: "7px 18px",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🎓</span>
            <span>Attend College Lecture (+Degree)</span>
          </button>
        </Html>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          13. RESTROOMS, SECURITY & EMERGENCY EXIT DOORS (East Wall, X: 16.8)
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[16.8, 0, -2]} rotation={[0, -Math.PI / 2, 0]}>
        {/* 🚪 DOOR 1: MEN'S RESTROOM */}
        <group position={[-3.2, 0, 0]}>
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[1.4, 3.1, 0.1]} />
            <meshStandardMaterial color="#475569" roughness={0.5} />
          </mesh>
          <mesh position={[0.5, 1.5, 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.16, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
          <Html position={[0, 3.2, 0]} center distanceFactor={10}>
            <div style={{ background: "#0284c7", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800 }}>
              🚪 MEN 🚹
            </div>
          </Html>
        </group>

        {/* 🚪 DOOR 2: WOMEN'S RESTROOM */}
        <group position={[-1.2, 0, 0]}>
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[1.4, 3.1, 0.1]} />
            <meshStandardMaterial color="#475569" roughness={0.5} />
          </mesh>
          <mesh position={[0.5, 1.5, 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.16, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
          <Html position={[0, 3.2, 0]} center distanceFactor={10}>
            <div style={{ background: "#ec4899", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800 }}>
              🚪 WOMEN 🚺
            </div>
          </Html>
        </group>

        {/* 🚪 DOOR 3: MALL SECURITY & MANAGEMENT OFFICE */}
        <group position={[1.2, 0, 0]}>
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[1.4, 3.1, 0.1]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* RFID Keycard Scanner */}
          <mesh position={[0.8, 1.5, 0.06]}>
            <boxGeometry args={[0.12, 0.18, 0.04]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
          </mesh>
          <Html position={[0, 3.2, 0]} center distanceFactor={10}>
            <div style={{ background: "#4338ca", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800 }}>
              🚪 SECURITY OFFICE 🚨
            </div>
          </Html>
        </group>

        {/* 🚪 DOOR 4: EMERGENCY FIRE EXIT DOUBLE PUSH BAR DOORS */}
        <group position={[3.6, 0, 0]}>
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[2.0, 3.1, 0.12]} />
            <meshStandardMaterial color="#991b1b" roughness={0.5} />
          </mesh>
          {/* Red Emergency Push Crash Bars */}
          <mesh position={[-0.45, 1.4, 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.8, 8]} />
            <meshStandardMaterial color="#ef4444" metalness={0.8} />
          </mesh>
          <mesh position={[0.45, 1.4, 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.8, 8]} />
            <meshStandardMaterial color="#ef4444" metalness={0.8} />
          </mesh>
          <Html position={[0, 3.2, 0]} center distanceFactor={10}>
            <div style={{ background: "#b91c1c", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800 }}>
              🚪 EMERGENCY EXIT ⚠️
            </div>
          </Html>
        </group>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          14. ATRIUM ESCALATORS & GLASS CYLINDRICAL OBSERVATION ELEVATOR
      ══════════════════════════════════════════════════════════════════════ */}
      {/* Central Glass Observation Elevator */}
      <group position={[0, 5.5, -5]}>
        <mesh>
          <cylinderGeometry args={[1.6, 1.6, 11, 20]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} transparent opacity={0.35} />
        </mesh>
        {[-1.5, 1.5].map((ex) => (
          <mesh key={`el_rail_${ex}`} position={[ex, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 11, 8]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {/* Elevator Cab with Warm Interior Lighting */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[1.4, 1.4, 2.5, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.8} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Dual Escalators to Mezzanine */}
      <group position={[-5, 2.6, -4]} rotation={[0.4, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.5, 8.8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[-0.7, 0.5, 0]}>
          <boxGeometry args={[0.08, 0.7, 8.8]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.4} />
        </mesh>
        <mesh position={[0.7, 0.5, 0]}>
          <boxGeometry args={[0.08, 0.7, 8.8]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.4} />
        </mesh>
      </group>

      <group position={[5, 2.6, -4]} rotation={[-0.4, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.5, 8.8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[-0.7, 0.5, 0]}>
          <boxGeometry args={[0.08, 0.7, 8.8]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.4} />
        </mesh>
        <mesh position={[0.7, 0.5, 0]}>
          <boxGeometry args={[0.08, 0.7, 8.8]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.4} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          15. POTTED PALMS, SHOPPER LOUNGES, AND COMMERCIAL BANNERS
      ══════════════════════════════════════════════════════════════════════ */}
      {/* Shopper Rest Lounges */}
      {[-5.5, 5.5].map((bx) => (
        <group key={`lounge_${bx}`} position={[bx, 0, 10.5]}>
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.8, 1.8, 0.5, 24]} />
            <meshStandardMaterial color="#0284c7" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.6, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Potted Indoor Palm Trees */}
      {[
        { x: -13, z: 10 },
        { x: 13, z: 10 },
        { x: -13, z: -13 },
        { x: 13, z: -13 },
      ].map((pt, idx) => (
        <group key={`palm_${idx}`} position={[pt.x, 0, pt.z]}>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.48, 0.38, 0.9, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.05, 16]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.6, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.11, 1.5, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <coneGeometry args={[1.3, 1.4, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Overhead Promotional Retail Banners */}
      <mesh position={[-6, 7.5, -8]}>
        <planeGeometry args={[4.5, 2.2]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position={[6, 7.5, -8]}>
        <planeGeometry args={[4.5, 2.2]} />
        <meshStandardMaterial color="#0284c7" />
      </mesh>

      {/* ══════════════════════════════════════════════════════════════════════
          16. GRAND AUTOMATIC SLIDING ENTRANCE DOORS (South, Z: 14.5)
              DOORS: BI-PARTING COMMERCIAL GLASS DOORS TO STATE STREET
      ══════════════════════════════════════════════════════════════════════ */}
      <group position={[0, 0, 14.5]}>
        <mesh position={[-1.4, 1.7, 0]}>
          <boxGeometry args={[2.5, 3.4, 0.15]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} transparent opacity={0.5} />
        </mesh>
        <mesh position={[1.4, 1.7, 0]}>
          <boxGeometry args={[2.5, 3.4, 0.15]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} transparent opacity={0.5} />
        </mesh>
        {/* Motion Sensor Header Bar */}
        <mesh position={[0, 3.5, 0]}>
          <boxGeometry args={[5.6, 0.4, 0.35]} />
          <meshStandardMaterial color="#09090b" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Exit Door Prompt */}
        <Html position={[0, 2.3, 0]} center distanceFactor={12}>
          <button
            onClick={() => onExitMall?.()}
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              color: "#f8fafc",
              border: "1.5px solid #38bdf8",
              borderRadius: "10px",
              padding: "10px 22px",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🏙️</span>
            <span>Exit Sliding Glass Doors to State Street [F]</span>
          </button>
        </Html>
      </group>

      {/* ══════════════════════════════════════════════════════════════════════
          17. CINEMATIC ATRIUM LIGHTING
      ══════════════════════════════════════════════════════════════════════ */}
      <ambientLight intensity={1.2} color="#f8fafc" />
      <directionalLight position={[0, 14, 0]} intensity={1.9} color="#fed7aa" castShadow />
      <pointLight position={[0, 4, 5.5]} intensity={1.4} color="#38bdf8" distance={14} />
      <pointLight position={[-10, 3.5, -9]} intensity={1.3} color="#fca5a5" distance={12} />
      <pointLight position={[10, 3.5, -9]} intensity={1.3} color="#93c5fd" distance={12} />
      <pointLight position={[-16, 3, -2]} intensity={1.2} color="#fef08a" distance={10} />
      <pointLight position={[0, 3, 0]} intensity={1.5} color="#38bdf8" distance={10} />
    </group>
  );
}
