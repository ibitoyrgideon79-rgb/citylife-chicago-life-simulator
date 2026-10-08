"use client";
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { HostileClientState, Net } from "../types/network";
import { MSG } from "../../shared/protocol";

function SingleHostile({
  cfg,
  net,
  onAttack,
}: {
  cfg: HostileClientState;
  net: Net;
  onAttack: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const curRotY = useRef(cfg.rot);

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group) return;

    const state = net.hostiles.get(cfg.id);
    const targetX = state ? state.x : cfg.x;
    const targetZ = state ? state.z : cfg.z;
    const targetRot = state ? state.rot : cfg.rot;

    const lerpSpeed = Math.min(1, dt * 15);
    group.position.x = THREE.MathUtils.lerp(group.position.x, targetX, lerpSpeed);
    group.position.z = THREE.MathUtils.lerp(group.position.z, targetZ, lerpSpeed);

    let diff = targetRot - curRotY.current;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    curRotY.current += diff * Math.min(1, dt * 18);
    group.rotation.y = curRotY.current;
  });

  const state = net.hostiles.get(cfg.id);
  const health = state?.health ?? cfg.health;
  const isAggro = state?.isAggro ?? false;
  const isAttacking = state?.isAttacking ?? false;
  const isDead = health <= 0;
  const isCultist = cfg.type === "cultist";

  if (isDead) return null;

  return (
    <group ref={groupRef} position={[cfg.x, 0, cfg.z]} rotation={[0, cfg.rot, 0]}>
      {/* ─── 1. 3D CHARACTER BODY (ANATOMICAL HUMANOID - NO LEGO BOXES) ─── */}
      {isCultist ? (
        // CULTIST: Hooded ritual robe over realistic human frame, glowing red eyes, ritual staff
        <group position={[0, 0, 0]}>
          {/* Robe Lower Body / Flowing Skirt */}
          <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.26, 0.44, 1.1, 16]} />
            <meshStandardMaterial color="#18181b" roughness={0.9} />
          </mesh>

          {/* Anatomical Contoured Torso */}
          <mesh position={[0, 1.25, 0]} scale={[1.12, 1, 0.78]} castShadow>
            <capsuleGeometry args={[0.18, 0.28, 8, 16]} />
            <meshStandardMaterial color="#09090b" roughness={0.8} />
          </mesh>

          {/* Cowl / Shoulder Drape */}
          <mesh position={[0, 1.4, 0]} scale={[1.25, 0.4, 0.95]} castShadow>
            <sphereGeometry args={[0.22, 16, 12]} />
            <meshStandardMaterial color="#09090b" roughness={0.8} />
          </mesh>

          {/* Sculpted Hooded Head */}
          <mesh position={[0, 1.68, -0.02]} scale={[0.15, 0.2, 0.16]} castShadow>
            <coneGeometry args={[1, 1.1, 14]} />
            <meshStandardMaterial color="#09090b" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.62, 0.05]} scale={[0.11, 0.12, 0.11]} castShadow>
            <sphereGeometry args={[1, 14, 12]} />
            <meshStandardMaterial color="#09090b" roughness={0.8} />
          </mesh>

          {/* Glowing Red Eyes inside hood */}
          <mesh position={[-0.055, 1.62, 0.14]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0.055, 1.62, 0.14]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>

          {/* Left Arm (Clutched Robe) */}
          <group position={[-0.28, 1.3, 0]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.062, 0.38, 6, 12]} />
              <meshStandardMaterial color="#09090b" roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.28, 0.04]} scale={[0.035, 0.045, 0.025]} castShadow>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#451a03" roughness={0.7} />
            </mesh>
          </group>

          {/* Right Arm (Wielding Ritual Staff) */}
          <group position={[0.28, 1.3, 0]} rotation={[isAttacking ? 1.0 : 0.2, 0, 0]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.062, 0.38, 6, 12]} />
              <meshStandardMaterial color="#09090b" roughness={0.8} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.28, 0.04]} scale={[0.035, 0.045, 0.025]} castShadow>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#451a03" roughness={0.7} />
            </mesh>
            {/* Ritual Staff */}
            <group position={[0, -0.22, 0.1]}>
              <mesh>
                <cylinderGeometry args={[0.024, 0.024, 1.5, 8]} />
                <meshStandardMaterial color="#451a03" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.8, 0]}>
                <octahedronGeometry args={[0.12]} />
                <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.85} />
              </mesh>
            </group>
          </group>
        </group>
      ) : (
        // SMOKER: Anatomical human street thug in leather jacket, dark jeans, beanie, cigarette & bat
        <group position={[0, 0, 0]}>
          {/* Anatomical Legs with Natural Quads, Knees & Calves */}
          {[-0.12, 0.12].map((lx, idx) => (
            <group key={`smoker_leg_${idx}`} position={[lx, 0.88, 0]}>
              {/* Thigh */}
              <mesh position={[0, -0.18, 0]} castShadow>
                <capsuleGeometry args={[0.075, 0.26, 6, 12]} />
                <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
              </mesh>
              {/* Knee & Calf */}
              <mesh position={[0, -0.48, 0]} castShadow>
                <capsuleGeometry args={[0.064, 0.28, 6, 12]} />
                <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
              </mesh>
              {/* Leather Combat Boots */}
              <mesh position={[0, -0.78, 0.03]} scale={[0.075, 0.05, 0.16]} castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#09090b" roughness={0.8} />
              </mesh>
            </group>
          ))}

          {/* Anatomical Torso - Distressed Leather Jacket */}
          <group position={[0, 1.15, 0]}>
            <mesh position={[0, 0.08, 0]} scale={[1.14, 1, 0.78]} castShadow>
              <capsuleGeometry args={[0.18, 0.28, 8, 16]} />
              <meshStandardMaterial color="#1c1917" roughness={0.4} metalness={0.25} />
            </mesh>
            <mesh position={[0, -0.14, 0]} scale={[1.04, 1, 0.74]} castShadow>
              <capsuleGeometry args={[0.15, 0.14, 6, 14]} />
              <meshStandardMaterial color="#1c1917" roughness={0.4} metalness={0.25} />
            </mesh>
            {/* Inner White Tee */}
            <mesh position={[0, 0.08, 0.138]}>
              <planeGeometry args={[0.1, 0.3]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.7} />
            </mesh>
          </group>

          {/* Sculpted Head & Facial Anatomy */}
          <group position={[0, 1.54, 0]}>
            {/* Neck */}
            <mesh position={[0, -0.11, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.072, 0.12, 14]} />
              <meshStandardMaterial color="#d4a373" roughness={0.65} />
            </mesh>
            {/* Skull & Jaw */}
            <mesh position={[0, 0.03, 0]} scale={[0.115, 0.138, 0.12]} castShadow>
              <sphereGeometry args={[1, 20, 16]} />
              <meshStandardMaterial color="#d4a373" roughness={0.65} />
            </mesh>
            <mesh position={[0, -0.06, 0.032]} scale={[0.082, 0.065, 0.088]} castShadow>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color="#d4a373" roughness={0.65} />
            </mesh>
            {/* Beanie Hat */}
            <mesh position={[0, 0.09, 0]} scale={[0.128, 0.1, 0.128]} castShadow>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color="#27272a" roughness={0.9} />
            </mesh>
            {/* Glowing Cigarette */}
            <group position={[0.04, -0.05, 0.12]} rotation={[0.2, 0.1, 0]}>
              <mesh>
                <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, 0.042, 0]}>
                <sphereGeometry args={[0.012, 6, 6]} />
                <meshBasicMaterial color="#f97316" />
              </mesh>
            </group>
          </group>

          {/* Left Arm */}
          <group position={[-0.29, 1.32, 0]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.065, 0.38, 6, 12]} />
              <meshStandardMaterial color="#1c1917" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.32, 0.02]} scale={[0.038, 0.052, 0.024]} castShadow>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color="#d4a373" roughness={0.65} />
            </mesh>
          </group>

          {/* Right Arm (Wielding Baseball Bat) */}
          <group position={[0.29, 1.32, 0]} rotation={[isAttacking ? 1.1 : 0.35, 0, 0]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.065, 0.38, 6, 12]} />
              <meshStandardMaterial color="#1c1917" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.32, 0.02]} scale={[0.038, 0.052, 0.024]} castShadow>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color="#d4a373" roughness={0.65} />
            </mesh>
            {/* Baseball Bat */}
            <mesh position={[0, -0.22, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.038, 0.022, 0.9, 10]} />
              <meshStandardMaterial color="#92400e" roughness={0.6} />
            </mesh>
          </group>
        </group>
      )}

      {/* ─── 2. FLOATING ENEMY STATUS BAR & AGGRO ALERT ─── */}
      <Html position={[0, 2.3, 0]} center distanceFactor={14}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onAttack();
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            userSelect: "none",
            cursor: "pointer",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))",
          }}
        >
          {/* Aggro Alert Banner */}
          {isAggro && (
            <div
              style={{
                background: "linear-gradient(90deg, #dc2626, #b91c1c)",
                color: "#fef08a",
                fontSize: "10px",
                fontWeight: 900,
                padding: "2px 8px",
                borderRadius: "6px",
                letterSpacing: "0.5px",
                animation: "pulse 0.6s infinite alternate",
                border: "1px solid #fef08a",
                whiteSpace: "nowrap",
              }}
            >
              ⚠️ HOSTILE AGGRO! ASSAULTING
            </div>
          )}

          {/* Enemy Name */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              color: isCultist ? "#f87171" : "#fbbf24",
              fontSize: "11px",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              whiteSpace: "nowrap",
            }}
          >
            {isCultist ? "🕯️" : "🚬"} {cfg.name}
          </div>

          {/* Health Bar */}
          <div
            style={{
              width: 54,
              height: 5,
              background: "rgba(0,0,0,0.8)",
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                width: `${Math.max(0, health)}%`,
                height: "100%",
                background:
                  health > 50
                    ? "linear-gradient(90deg, #ef4444, #f87171)"
                    : "linear-gradient(90deg, #991b1b, #dc2626)",
                transition: "width 0.2s ease",
              }}
            />
          </div>

          {/* Attack prompt if nearby */}
          <div
            style={{
              fontSize: "9px",
              color: "#e2e8f0",
              background: "rgba(0,0,0,0.6)",
              padding: "1px 5px",
              borderRadius: "3px",
              marginTop: "1px",
            }}
          >
            Click or [Space] to Fight
          </div>
        </div>
      </Html>
    </group>
  );
}

export default function HostilesLayer({ net }: { net: Net }) {
  const hostileList = Array.from(net.hostiles.values());

  const handleAttack = () => {
    if (net.room) {
      net.room.send(MSG.player_attack);
    }
  };

  return (
    <group>
      {hostileList.map((cfg) => (
        <SingleHostile key={cfg.id} cfg={cfg} net={net} onAttack={handleAttack} />
      ))}
    </group>
  );
}
