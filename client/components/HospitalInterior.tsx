"use client";

import React from "react";

export default function HospitalInterior() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.12, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#dce5e8" roughness={0.84} />
      </mesh>
      <mesh position={[0, 2.3, -5.8]} receiveShadow>
        <boxGeometry args={[12, 4.6, 0.25]} />
        <meshStandardMaterial color="#e7eef0" roughness={0.8} />
      </mesh>
      <mesh position={[-5.8, 2.3, 0]} receiveShadow>
        <boxGeometry args={[0.25, 4.6, 12]} />
        <meshStandardMaterial color="#edf2f3" roughness={0.8} />
      </mesh>
      <mesh position={[5.8, 2.3, 0]} receiveShadow>
        <boxGeometry args={[0.25, 4.6, 12]} />
        <meshStandardMaterial color="#edf2f3" roughness={0.8} />
      </mesh>

      <group position={[0, 0.35, -0.2]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[1.35, 0.12, 2.5]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.56} />
        </mesh>
        <mesh position={[0, 0.43, 0.74]} castShadow>
          <boxGeometry args={[1.25, 0.22, 0.58]} />
          <meshStandardMaterial color="#ffffff" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.05, -0.65]}>
          <boxGeometry args={[1.55, 0.08, 0.08]} />
          <meshStandardMaterial color="#9aa8ae" metalness={0.72} roughness={0.3} />
        </mesh>
        {[-0.64, 0.64].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 0.23, 0]} castShadow>
              <boxGeometry args={[0.07, 0.45, 2.45]} />
              <meshStandardMaterial color="#aab8bd" metalness={0.72} roughness={0.32} />
            </mesh>
            {[-1, 1].map((z) => (
              <mesh key={z} position={[0, -0.13, z * 1.02]}>
                <cylinderGeometry args={[0.035, 0.035, 0.62, 8]} />
                <meshStandardMaterial color="#94a3a8" metalness={0.75} roughness={0.3} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      <group position={[2.8, 0, -3.6]}>
        <mesh position={[0, 1.25, 0]} castShadow>
          <boxGeometry args={[0.9, 1.25, 0.4]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        <mesh position={[0, 2.05, 0.22]}>
          <boxGeometry args={[0.72, 0.42, 0.04]} />
          <meshStandardMaterial color="#111827" emissive="#0f766e" emissiveIntensity={0.38} />
        </mesh>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 2.1, 10]} />
          <meshStandardMaterial color="#aab8bd" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.23, 0]}>
          <torusGeometry args={[0.14, 0.025, 8, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0, 2.28, 0]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          <meshStandardMaterial color="#dbeafe" emissive="#93c5fd" emissiveIntensity={0.45} />
        </mesh>
      </group>

      <mesh position={[0, 4.45, 0]}>
        <boxGeometry args={[2.2, 0.08, 0.7]} />
        <meshStandardMaterial color="#fff7d6" emissive="#fff7d6" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[-2.5, 1.8, -5.63]}>
        <boxGeometry args={[2.2, 1.25, 0.04]} />
        <meshStandardMaterial color="#bfdbfe" roughness={0.25} />
      </mesh>
    </group>
  );
}
