"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { STREET_PEDESTRIANS } from "../../shared/protocol";
import type { Net } from "../types/network";
import HumanoidNPC from "./HumanoidNPC";

function Commuter({ id, net }: { id: string; net: Net }) {
  const group = useRef<THREE.Group>(null);
  const config = STREET_PEDESTRIANS.find((pedestrian) => pedestrian.id === id);
  const [activity, setActivity] = useState(config?.itinerary[0]?.activity ?? "Walking");
  const lastActivity = useRef(activity);

  useFrame((_, delta) => {
    if (!group.current || !config) return;
    const state = net.pedestrians.get(id);
    const nextActivity = state?.activity ?? config?.itinerary[0]?.activity ?? "Walking";
    if (lastActivity.current !== nextActivity) {
      lastActivity.current = nextActivity;
      setActivity(nextActivity);
    }
    const speed = Math.min(1, delta * 12);
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, state?.x ?? config.x, speed);
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, state?.z ?? config.z, speed);
    const targetRot = state?.rot ?? 0;
    let angle = targetRot - group.current.rotation.y;
    while (angle < -Math.PI) angle += Math.PI * 2;
    while (angle > Math.PI) angle -= Math.PI * 2;
    group.current.rotation.y += angle * speed;
  });

  return (
    <group ref={group} position={[config?.x ?? 0, 0, config?.z ?? 0]}>
      <HumanoidNPC
        gender={config?.gender ?? "male"}
        topColor={config?.topColor ?? "#2563eb"}
        bottomColor={config?.bottomColor ?? "#334155"}
        shoeColor="#f8fafc"
        pose={activity.toLowerCase().includes("walking") || activity.toLowerCase().includes("heading") ? "walking" : "standing"}
        scale={0.96}
      />
      <Html position={[0, 2.2, 0]} center distanceFactor={9}>
        <div style={{
          background: "rgba(15,23,42,.84)",
          color: "#f8fafc",
          border: "1px solid rgba(148,163,184,.45)",
          borderRadius: 8,
          padding: "3px 7px",
          font: "600 10px system-ui",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {activity}
        </div>
      </Html>
    </group>
  );
}

function PizzaStand() {
  return (
    <group position={[24, 0, 16]}>
      <mesh position={[0, 1.12, 0]} castShadow>
        <boxGeometry args={[2.8, 0.95, 1.15]} />
        <meshStandardMaterial color="#8b451f" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <boxGeometry args={[3, 0.12, 1.3]} />
        <meshStandardMaterial color="#d6b98c" roughness={0.55} />
      </mesh>
      <mesh position={[0, 2.12, -0.05]} castShadow>
        <boxGeometry args={[3.1, 0.16, 1.4]} />
        <meshStandardMaterial color="#991b1b" roughness={0.6} />
      </mesh>
      {[-1.05, -0.35, 0.35, 1.05].map((x) => (
        <mesh key={x} position={[x, 2.08, 0.67]} castShadow>
          <boxGeometry args={[0.34, 0.23, 0.035]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0.88, 1.77, -0.12]} castShadow>
        <boxGeometry args={[0.72, 0.62, 0.65]} />
        <meshStandardMaterial color="#374151" metalness={0.55} roughness={0.45} />
      </mesh>
      <mesh position={[0.88, 1.78, 0.22]}>
        <circleGeometry args={[0.19, 16]} />
        <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[-0.82, 1.77, 0.03]}>
        <cylinderGeometry args={[0.16, 0.16, 0.3, 12]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.4} />
      </mesh>
      <HumanoidNPC
        position={[0, 0, -0.88]}
        gender="female"
        hairStyle="bun"
        topType="apron"
        topColor="#b91c1c"
        bottomColor="#334155"
        accessory="clipboard"
        pose="serving"
        scale={0.94}
      />
    </group>
  );
}

function HotDogCart() {
  return (
    <group position={[-30, 0, 17]}>
      <mesh position={[0, 0.98, 0]} castShadow>
        <boxGeometry args={[1.75, 0.7, 1.05]} />
        <meshStandardMaterial color="#166534" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.37, 0]} castShadow>
        <boxGeometry args={[1.95, 0.12, 1.22]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.15} roughness={0.48} />
      </mesh>
      {[-0.57, 0.57].map((x) => (
        <mesh key={x} position={[x, 0.42, 0.52]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.22, 0.065, 8, 18]} />
          <meshStandardMaterial color="#111827" roughness={0.92} />
        </mesh>
      ))}
      <mesh position={[0, 1.78, -0.05]} castShadow>
        <boxGeometry args={[2.05, 0.12, 1.32]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.67, 0.61]} castShadow>
        <boxGeometry args={[1.7, 0.2, 0.035]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.8} />
      </mesh>
      {[-0.37, 0, 0.37].map((x, index) => (
        <mesh key={x} position={[x, 1.62, 0.39]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.25, 10]} />
          <meshStandardMaterial color={["#eab308", "#b91c1c", "#15803d"][index]} roughness={0.35} />
        </mesh>
      ))}
      <HumanoidNPC
        position={[0, 0, -0.86]}
        gender="male"
        hairStyle="cap"
        topType="apron"
        topColor="#166534"
        bottomColor="#1f2937"
        accessory="coffee_cup"
        pose="serving"
        scale={0.94}
      />
    </group>
  );
}

function InfoKiosk() {
  return (
    <group position={[43.5, 0, 36.5]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[1.25, 2.05, 0.42]} />
        <meshStandardMaterial color="#334155" metalness={0.55} roughness={0.42} />
      </mesh>
      <mesh position={[0, 1.38, 0.225]}>
        <planeGeometry args={[0.92, 0.78]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[0, 0.72, 0.228]}>
        <planeGeometry args={[0.88, 0.34]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[1.5, 0.16, 0.65]} />
        <meshStandardMaterial color="#1e293b" metalness={0.45} roughness={0.4} />
      </mesh>
      <HumanoidNPC
        position={[-0.95, 0, -0.05]}
        gender="female"
        hairStyle="long"
        topType="jacket"
        topColor="#0369a1"
        bottomColor="#1e293b"
        accessory="ipad"
        pose="serving"
        scale={0.92}
      />
    </group>
  );
}

export default function LoopStreetLife({ net }: { net: Net }) {
  return (
    <group>
      <PizzaStand />
      <HotDogCart />
      <InfoKiosk />
      {STREET_PEDESTRIANS.map((pedestrian) => (
        <Commuter key={pedestrian.id} id={pedestrian.id} net={net} />
      ))}
    </group>
  );
}
