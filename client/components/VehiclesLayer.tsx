"use client";
import React, { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { INITIAL_VEHICLES, type VehicleConfig } from "../../shared/protocol";
import type { Net, VehicleClientState } from "../types/network";
import HumanoidNPC from "./HumanoidNPC";

function SingleVehicle({
  cfg,
  net,
  isNearby,
  onEnter,
}: {
  cfg: VehicleConfig;
  net: Net;
  isNearby: boolean;
  onEnter: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const doorRef = useRef<THREE.Group>(null);
  const passengerDoorRef = useRef<THREE.Group>(null);
  const redLightRef = useRef<THREE.Mesh>(null);
  const blueLightRef = useRef<THREE.Mesh>(null);
  const amberLightRef = useRef<THREE.Mesh>(null);
  const curRotY = useRef(cfg.rot);

  useFrame(({ clock }, dt) => {
    const group = groupRef.current;
    if (!group) return;

    // Get live synced vehicle state from server
    const state: VehicleClientState | undefined = net.vehicles.get(cfg.id);
    const targetX = state ? state.x : cfg.x;
    const targetZ = state ? state.z : cfg.z;
    const targetRot = state ? state.rot : cfg.rot;

    // Smooth position interpolation
    const lerpSpeed = Math.min(1, dt * 25);
    group.position.x = THREE.MathUtils.lerp(group.position.x, targetX, lerpSpeed);
    group.position.z = THREE.MathUtils.lerp(group.position.z, targetZ, lerpSpeed);

    // Smooth angle interpolation with wrap-around
    let diff = targetRot - curRotY.current;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    curRotY.current += diff * Math.min(1, dt * 20);
    group.rotation.y = curRotY.current;

    if (doorRef.current) {
      const targetDoorAngle = state?.doorOpen ? 0.8 : 0;
      doorRef.current.rotation.y = THREE.MathUtils.lerp(
        doorRef.current.rotation.y,
        targetDoorAngle,
        Math.min(1, dt * 9),
      );
    }
    if (passengerDoorRef.current) {
      const targetDoorAngle = state?.serviceType === "uber" && state.ridePhase === "waiting" ? -0.8 : 0;
      passengerDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        passengerDoorRef.current.rotation.y,
        targetDoorAngle,
        Math.min(1, dt * 9),
      );
    }
    const lightsOn = Math.floor(clock.elapsedTime * 5) % 2 === 0;
    if (redLightRef.current) redLightRef.current.visible = lightsOn;
    if (blueLightRef.current) blueLightRef.current.visible = !lightsOn;
    if (amberLightRef.current) amberLightRef.current.visible = lightsOn;
  });

  const state = net.vehicles.get(cfg.id);
  const isDrivenByMe = state?.driverId === net.me;
  const isOccupied = !!state?.driverId;
  const isTaxi = cfg.model === "taxi";
  const hasEmergencyLights = cfg.model === "police" || cfg.model === "ambulance";
  const modelScale: [number, number, number] = cfg.model === "sports"
    ? [0.94, 0.74, 0.93]
    : cfg.model === "suv" || cfg.model === "ambulance"
      ? [1.08, 1.16, 1.08]
      : cfg.model === "police"
        ? [1.02, 0.96, 1.02]
        : [1, 1, 1];

  return (
    <group ref={groupRef} position={[cfg.x, 0.72, cfg.z]} rotation={[0, cfg.rot, 0]} scale={modelScale}>
      {/* 1. Main Car Body Chassis */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <boxGeometry args={[1.9, 0.65, 4.6]} />
        <meshStandardMaterial
          color={cfg.color}
          roughness={0.25}
          metalness={0.65}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* 2. Front Hood Slope Accent */}
      <mesh position={[0, 0.32, -1.6]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[1.82, 0.5, 1.2]} />
        <meshStandardMaterial color={cfg.color} roughness={0.25} metalness={0.65} />
      </mesh>

      {/* 3. Cabin / Tinted Glass Windshield & Roof */}
      <mesh castShadow position={[0, 0.88, -0.2]}>
        <boxGeometry args={[1.68, 0.58, 2.5]} />
        <meshStandardMaterial color="#17212b" roughness={0.17} metalness={0.55} transparent opacity={0.54} />
      </mesh>

      {/* Driver-side door swings open before boarding. */}
      <group ref={doorRef} position={[-0.91, 0.7, -0.06]}>
        <mesh position={[-0.04, 0, 0.62]} castShadow>
          <boxGeometry args={[0.09, 0.57, 1.3]} />
          <meshStandardMaterial color={cfg.color} roughness={0.28} metalness={0.5} />
        </mesh>
        <mesh position={[-0.03, 0.16, 0.62]}>
          <boxGeometry args={[0.035, 0.25, 0.86]} />
          <meshStandardMaterial color="#7dd3fc" roughness={0.12} metalness={0.55} transparent opacity={0.65} />
        </mesh>
      </group>
      {state?.serviceType === "uber" && (
        <>
          <group ref={passengerDoorRef} position={[0.91, 0.7, -0.06]}>
            <mesh position={[0.04, 0, 0.62]} castShadow>
              <boxGeometry args={[0.09, 0.57, 1.3]} />
              <meshStandardMaterial color={cfg.color} roughness={0.28} metalness={0.5} />
            </mesh>
            <mesh position={[0.03, 0.16, 0.62]}>
              <boxGeometry args={[0.035, 0.25, 0.86]} />
              <meshStandardMaterial color="#7dd3fc" roughness={0.12} metalness={0.55} transparent opacity={0.65} />
            </mesh>
          </group>
          <group position={[0, 1.31, 0.45]}>
            <mesh>
              <boxGeometry args={[0.82, 0.22, 0.34]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.42} />
            </mesh>
            <Html position={[0, 0.01, 0.18]} center distanceFactor={14}>
              <span style={{ color: "#111827", font: "900 9px system-ui", letterSpacing: 1 }}>UBER</span>
            </Html>
          </group>
          {state.ridePhase === "waiting" && (
            <mesh position={[0, 1.27, -0.62]} ref={amberLightRef}>
              <boxGeometry args={[0.48, 0.12, 0.2]} />
              <meshBasicMaterial color="#f59e0b" />
            </mesh>
          )}
        </>
      )}

      {isTaxi && !state?.driverId && (
        <HumanoidNPC
          position={[-0.42, 0.34, -0.25]}
          rotation={[0, Math.PI, 0]}
          gender="male"
          hairStyle="fade"
          topType="polo"
          topColor="#111827"
          bottomColor="#1f2937"
          scale={0.44}
        />
      )}

      {/* 4. Front Windshield Glass Reflection Accent */}
      <mesh position={[0, 0.85, -1.35]} rotation={[0.42, 0, 0]}>
        <planeGeometry args={[1.5, 0.65]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} transparent opacity={0.6} />
      </mesh>

      {/* 5. Front Bumper & Dark Radiator Grille */}
      <mesh position={[0, 0.18, -2.32]}>
        <boxGeometry args={[1.75, 0.28, 0.1]} />
        <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 6. Front Headlights (Bright White / Yellow) */}
      <mesh position={[-0.72, 0.35, -2.32]}>
        <boxGeometry args={[0.34, 0.18, 0.08]} />
        <meshBasicMaterial color={isOccupied ? "#fef08a" : "#e2e8f0"} />
      </mesh>
      <mesh position={[0.72, 0.35, -2.32]}>
        <boxGeometry args={[0.34, 0.18, 0.08]} />
        <meshBasicMaterial color={isOccupied ? "#fef08a" : "#e2e8f0"} />
      </mesh>

      {/* 7. Rear Bumper & Red Taillights */}
      <mesh position={[0, 0.18, 2.32]}>
        <boxGeometry args={[1.75, 0.28, 0.1]} />
        <meshStandardMaterial color="#18181b" metalness={0.8} />
      </mesh>
      <mesh position={[-0.72, 0.35, 2.32]}>
        <boxGeometry args={[0.34, 0.18, 0.08]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0.72, 0.35, 2.32]}>
        <boxGeometry args={[0.34, 0.18, 0.08]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* 8. Wheels (Rubber Tires with Metallic Hub Rims) */}
      {[
        [-0.98, 0, -1.35],
        [0.98, 0, -1.35],
        [-0.98, 0, 1.35],
        [0.98, 0, 1.35],
      ].map(([wx, wy, wz], wIdx) => (
        <group key={wIdx} position={[wx, wy, wz]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.36, 0.36, 0.24, 16]} />
            <meshStandardMaterial color="#18181b" roughness={0.9} />
          </mesh>
          <mesh position={[wx > 0 ? 0.02 : -0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.25, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* 9. Chicago Yellow Cab Roof Sign */}
      {isTaxi && (
        <group position={[0, 1.25, -0.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.85, 0.22, 0.38]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
          <mesh position={[0, 0, 0.2]}>
            <planeGeometry args={[0.75, 0.16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
      )}

      {hasEmergencyLights && (
        <group position={[0, 1.27, -0.12]}>
          <mesh position={[-0.3, 0, 0]} ref={redLightRef}>
            <boxGeometry args={[0.36, 0.16, 0.25]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0.3, 0, 0]} ref={blueLightRef}>
            <boxGeometry args={[0.36, 0.16, 0.25]} />
            <meshBasicMaterial color="#2563eb" />
          </mesh>
          {cfg.model === "police" && (
            <mesh position={[0, -0.23, 0.02]}>
              <boxGeometry args={[1.72, 0.035, 1.5]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>
          )}
        </group>
      )}

      {/* 10. Interactive Proximity Prompt Badge (when on foot & close) */}
      {isNearby && !isOccupied && !state?.serviceType && (state?.speed ?? 0) < 1.5 && (
        <Html position={[0, 2.2, 0]} center distanceFactor={12}>
          <div
            onClick={() => onEnter(cfg.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              background: "rgba(15, 23, 42, 0.94)",
              border: "2px solid #38bdf8",
              borderRadius: "16px",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 800,
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
              boxShadow: "0 0 16px rgba(56, 189, 248, 0.8)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <span>🚗</span>
            <span>{state?.doorOpen ? `Enter ${cfg.name}` : `Open ${cfg.name} door`}</span>
            <span
              style={{
                background: "#38bdf8",
                color: "#0f172a",
                padding: "2px 6px",
                borderRadius: "8px",
                fontSize: "10px",
                marginLeft: "4px",
              }}
            >
              PRESS [F]
            </span>
          </div>
        </Html>
      )}

      {/* Driving indicator for other players */}
      {isDrivenByMe && (
        <Html position={[0, 2.2, 0]} center distanceFactor={14}>
          <div
            style={{
              padding: "3px 8px",
              background: "rgba(34, 197, 94, 0.9)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 800,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            DRIVING
          </div>
        </Html>
      )}
    </group>
  );
}

export default function VehiclesLayer({
  net,
  nearbyVehicleId,
  onEnterVehicle,
}: {
  net: Net;
  nearbyVehicleId: string | null;
  onEnterVehicle: (id: string) => void;
}) {
  const [, setSyncVersion] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSyncVersion((version) => version + 1), 500);
    return () => clearInterval(interval);
  }, []);

  const configs = new Map(INITIAL_VEHICLES.map((vehicle) => [vehicle.id, vehicle]));
  net.vehicles.forEach((vehicle) => {
    if (configs.has(vehicle.id)) return;
    configs.set(vehicle.id, {
      id: vehicle.id,
      x: vehicle.x,
      z: vehicle.z,
      rot: vehicle.rot,
      color: vehicle.color,
      model: vehicle.model,
      name: vehicle.name,
    });
  });

  return (
    <group>
      {[...configs.values()].map((cfg) => (
        <SingleVehicle
          key={cfg.id}
          cfg={cfg}
          net={net}
          isNearby={nearbyVehicleId === cfg.id}
          onEnter={onEnterVehicle}
        />
      ))}
    </group>
  );
}
