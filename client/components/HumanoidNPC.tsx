"use client";
import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export interface HumanoidNPCProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  gender?: "male" | "female";
  skinTone?: string;
  hairColor?: string;
  hairStyle?: "fade" | "bun" | "long" | "beanie" | "chef_hat" | "hood" | "slick" | "cap";
  topType?: "blazer" | "chef" | "tshirt" | "vest" | "apron" | "jacket" | "robe" | "polo";
  topColor?: string;
  innerColor?: string;
  bottomColor?: string;
  shoeColor?: string;
  accessory?: "glasses" | "chain" | "name_tag" | "ipad" | "coffee_cup" | "bat" | "staff" | "clipboard" | "none";
  pose?: "standing" | "typing" | "serving" | "holding_item" | "leaning" | "walking";
  scale?: number;
}

/**
 * HumanoidNPC: High-fidelity anatomically proportioned human character model.
 * Completely eliminates any boxy Lego/Minecraft toy appearance with:
 * - Sculpted cranial vault, jawline, ears, nose bridge, eyes & irises
 * - Organic neck cylinder & rounded deltoid shoulder joints
 * - Natural bicep/forearm taper, articulated wrists, and curved hands with thumbs
 * - Contoured chest/pectorals, tapered waist, hips
 * - Anatomical thighs, patella knee bends, sculpted calves & ankles
 * - Curved aerodynamic sneakers/shoes with distinct soles and uppers
 */
export default function HumanoidNPC({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  gender = "male",
  skinTone = "#d49b72",
  hairColor = "#1e1e24",
  hairStyle = "fade",
  topType = "tshirt",
  topColor = "#2563eb",
  innerColor = "#ffffff",
  bottomColor = "#1e293b",
  shoeColor = "#ffffff",
  accessory = "none",
  pose = "standing",
  scale = 1,
}: HumanoidNPCProps) {
  const isFemale = gender === "female";
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const swing = Math.sin(clock.elapsedTime * 7);
    if (pose === "walking") {
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0.05 + swing * 0.35;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.05 - swing * 0.35;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing * 0.38;
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing * 0.38;
    } else if (pose === "serving") {
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0.8 + swing * 0.1;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.05 + swing * 0.08;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* ─── 1. HEAD & FACIAL FEATURES ─── */}
      <group position={[0, 1.54, 0]}>
        {/* Anatomical Neck */}
        <mesh position={[0, -0.11, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.072, 0.12, 14]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>

        {/* Skull / Cranium (Curved organic anatomical head) */}
        <mesh position={[0, 0.03, 0]} scale={[0.115, 0.138, 0.12]} castShadow>
          <sphereGeometry args={[1, 22, 18]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>

        {/* Sculpted Jawline & Chin */}
        <mesh position={[0, -0.06, 0.032]} scale={[0.082, 0.065, 0.088]} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>

        {/* Natural Curved Ears */}
        <mesh position={[-0.12, 0.02, -0.01]} scale={[0.02, 0.035, 0.022]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>
        <mesh position={[0.12, 0.02, -0.01]} scale={[0.02, 0.035, 0.022]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>

        {/* Nose Bridge & Tip */}
        <mesh position={[0, -0.015, 0.12]} scale={[0.018, 0.035, 0.022]}>
          <coneGeometry args={[1, 1, 8]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>

        {/* Eyes (Sclera) */}
        <mesh position={[-0.045, 0.02, 0.104]} scale={[0.026, 0.015, 0.009]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[0.045, 0.02, 0.104]} scale={[0.026, 0.015, 0.009]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Irises & Pupils */}
        <mesh position={[-0.045, 0.02, 0.113]} scale={[0.013, 0.013, 0.005]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#1e3a5f" roughness={0.2} />
        </mesh>
        <mesh position={[0.045, 0.02, 0.113]} scale={[0.013, 0.013, 0.005]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#1e3a5f" roughness={0.2} />
        </mesh>

        {/* Eyebrows */}
        <mesh position={[-0.045, 0.042, 0.108]} rotation={[0, 0, 0.08]} scale={[0.032, 0.006, 0.008]}>
          <capsuleGeometry args={[1, 1, 4, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
        <mesh position={[0.045, 0.042, 0.108]} rotation={[0, 0, -0.08]} scale={[0.032, 0.006, 0.008]}>
          <capsuleGeometry args={[1, 1, 4, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>

        {/* HAIR & HEADWEAR */}
        {hairStyle === "fade" && (
          <mesh position={[0, 0.08, -0.015]} scale={[0.126, 0.076, 0.126]} castShadow>
            <sphereGeometry args={[1, 18, 14]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
        )}
        {hairStyle === "bun" && (
          <group>
            <mesh position={[0, 0.07, -0.015]} scale={[0.126, 0.082, 0.128]} castShadow>
              <sphereGeometry args={[1, 18, 14]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.15, -0.08]} scale={[0.07, 0.07, 0.07]} castShadow>
              <sphereGeometry args={[1, 14, 12]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
          </group>
        )}
        {hairStyle === "long" && (
          <group>
            <mesh position={[0, 0.07, -0.015]} scale={[0.128, 0.085, 0.13]} castShadow>
              <sphereGeometry args={[1, 18, 14]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.08, -0.07]} scale={[0.125, 0.22, 0.09]} castShadow>
              <sphereGeometry args={[1, 14, 12]} />
              <meshStandardMaterial color={hairColor} roughness={0.8} />
            </mesh>
          </group>
        )}
        {hairStyle === "beanie" && (
          <group>
            <mesh position={[0, 0.09, 0]} scale={[0.13, 0.11, 0.13]} castShadow>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color="#27272a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.03, 0]} scale={[0.134, 0.03, 0.134]}>
              <cylinderGeometry args={[1, 1, 1, 16]} />
              <meshStandardMaterial color="#3f3f46" roughness={0.9} />
            </mesh>
          </group>
        )}
        {hairStyle === "cap" && (
          <group position={[0, 0.07, 0]}>
            <mesh scale={[0.128, 0.07, 0.128]} castShadow>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color="#0284c7" roughness={0.6} />
            </mesh>
            {/* Cap Visor / Bill */}
            <mesh position={[0, -0.01, 0.12]} rotation={[0.15, 0, 0]} scale={[0.13, 0.015, 0.12]}>
              <cylinderGeometry args={[1, 1, 1, 14]} />
              <meshStandardMaterial color="#0284c7" roughness={0.6} />
            </mesh>
          </group>
        )}
        {hairStyle === "chef_hat" && (
          <group position={[0, 0.16, 0]}>
            <mesh scale={[0.11, 0.14, 0.11]} castShadow>
              <cylinderGeometry args={[1.2, 0.95, 1.2, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.12, 0]} scale={[0.135, 0.08, 0.135]} castShadow>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.7} />
            </mesh>
          </group>
        )}
        {hairStyle === "hood" && (
          <mesh position={[0, 0.05, -0.04]} scale={[0.16, 0.22, 0.16]} castShadow>
            <coneGeometry args={[1, 1, 14]} />
            <meshStandardMaterial color="#09090b" roughness={0.9} />
          </mesh>
        )}

        {/* Glasses Accessory */}
        {accessory === "glasses" && (
          <group position={[0, 0.02, 0.116]}>
            <mesh position={[-0.045, 0, 0]}>
              <ringGeometry args={[0.018, 0.024, 12]} />
              <meshStandardMaterial color="#09090b" metalness={0.8} />
            </mesh>
            <mesh position={[0.045, 0, 0]}>
              <ringGeometry args={[0.018, 0.024, 12]} />
              <meshStandardMaterial color="#09090b" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.03, 0.005, 0.005]} />
              <meshStandardMaterial color="#09090b" metalness={0.8} />
            </mesh>
          </group>
        )}
      </group>

      {/* ─── 2. TORSO & APPAREL ─── */}
      <group position={[0, 1.15, 0]}>
        {/* Anatomical Pectoral / Upper Torso */}
        <mesh position={[0, 0.08, 0]} scale={isFemale ? [1.02, 1, 0.76] : [1.14, 1, 0.78]} castShadow>
          <capsuleGeometry args={[0.18, 0.28, 8, 16]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>

        {/* Tapered Waist & Abdomen */}
        <mesh position={[0, -0.14, 0]} scale={isFemale ? [0.92, 1, 0.72] : [1.04, 1, 0.74]} castShadow>
          <capsuleGeometry args={[0.15, 0.14, 6, 14]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>

        {/* Inner Shirt Collar (for blazer / vest / jacket) */}
        {(topType === "blazer" || topType === "vest" || topType === "jacket") && (
          <mesh position={[0, 0.08, 0.138]}>
            <planeGeometry args={[0.11, 0.34]} />
            <meshStandardMaterial color={innerColor} roughness={0.7} />
          </mesh>
        )}

        {/* Gold Chain Accessory */}
        {accessory === "chain" && (
          <mesh position={[0, 0.14, 0.14]} rotation={[0.4, 0, 0]}>
            <torusGeometry args={[0.08, 0.012, 8, 20]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
          </mesh>
        )}

        {/* Name Tag */}
        {accessory === "name_tag" && (
          <mesh position={[0.09, 0.16, 0.145]}>
            <boxGeometry args={[0.055, 0.024, 0.008]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.3} />
          </mesh>
        )}

        {/* Barista / Chef Apron Overlay */}
        {(topType === "apron" || topType === "chef") && (
          <mesh position={[0, -0.04, 0.136]}>
            <planeGeometry args={[0.22, 0.44]} />
            <meshStandardMaterial color={topType === "chef" ? "#b91c1c" : "#047857"} roughness={0.7} />
          </mesh>
        )}

        {/* Waist Belt */}
        <mesh position={[0, -0.24, 0]} scale={[1.06, 1, 0.76]}>
          <cylinderGeometry args={[0.17, 0.17, 0.045, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.24, 0.132]}>
          <boxGeometry args={[0.05, 0.035, 0.01]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* ─── 3. ARMS & HANDS (Anatomical articulated curves) ─── */}
      {/* Left Arm */}
      <group
        ref={leftArmRef}
        position={[isFemale ? -0.27 : -0.29, 1.32, 0]}
        rotation={
          pose === "typing"
            ? [0.65, 0.2, 0]
            : pose === "serving"
              ? [0.8, -0.2, 0]
              : [0.05, 0, 0]
        }
      >
        {/* Deltoid Shoulder */}
        <mesh castShadow>
          <sphereGeometry args={[0.078, 12, 12]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>
        {/* Bicep Sleeve */}
        <mesh position={[0, -0.16, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.2, 6, 12]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>
        {/* Elbow */}
        <mesh position={[0, -0.27, 0]} castShadow>
          <sphereGeometry args={[0.054, 10, 10]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>
        {/* Forearm (Skin or long sleeve) */}
        <mesh position={[0, -0.38, 0]} castShadow>
          <capsuleGeometry args={[0.052, 0.16, 6, 12]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>
        {/* Wrist & Hand */}
        <mesh position={[0, -0.5, 0]} scale={[0.038, 0.055, 0.024]} castShadow>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>
        {/* Natural Thumb */}
        <mesh position={[0.028, -0.48, 0.012]} rotation={[0, 0, -0.35]} scale={[0.014, 0.03, 0.014]}>
          <capsuleGeometry args={[1, 1, 4, 8]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>

        {/* Handheld Accessory Left Hand */}
        {accessory === "clipboard" && (
          <group position={[0, -0.52, 0.1]} rotation={[0.4, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.22, 0.32, 0.02]} />
              <meshStandardMaterial color="#78350f" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.015]}>
              <planeGeometry args={[0.18, 0.26]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
          </group>
        )}
      </group>

      {/* Right Arm */}
      <group
        ref={rightArmRef}
        position={[isFemale ? 0.27 : 0.29, 1.32, 0]}
        rotation={pose === "typing" ? [0.65, -0.2, 0] : pose === "holding_item" ? [0.75, 0, 0] : [-0.05, 0, 0]}
      >
        <mesh castShadow>
          <sphereGeometry args={[0.078, 12, 12]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.16, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.2, 6, 12]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.27, 0]} castShadow>
          <sphereGeometry args={[0.054, 10, 10]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow>
          <capsuleGeometry args={[0.052, 0.16, 6, 12]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>
        <mesh position={[0, -0.5, 0]} scale={[0.038, 0.055, 0.024]} castShadow>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>
        <mesh position={[-0.028, -0.48, 0.012]} rotation={[0, 0, 0.35]} scale={[0.014, 0.03, 0.014]}>
          <capsuleGeometry args={[1, 1, 4, 8]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>

        {/* Handheld Accessories Right Hand */}
        {accessory === "coffee_cup" && (
          <group position={[0, -0.52, 0.08]}>
            <mesh>
              <cylinderGeometry args={[0.045, 0.035, 0.12, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.048, 0.048, 0.02, 12]} />
              <meshStandardMaterial color="#047857" roughness={0.4} />
            </mesh>
          </group>
        )}

        {accessory === "ipad" && (
          <group position={[0, -0.52, 0.08]} rotation={[0.4, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.18, 0.26, 0.012]} />
              <meshStandardMaterial color="#09090b" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.008]}>
              <planeGeometry args={[0.16, 0.24]} />
              <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} />
            </mesh>
          </group>
        )}
      </group>

      {/* ─── 4. LEGS & NATURAL SNEAKERS / SHOES ─── */}
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.115, 0.88, 0]}>
        {/* Hip Joint */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.082, 10, 10]} />
          <meshStandardMaterial color={bottomColor} roughness={0.6} />
        </mesh>
        {/* Thigh (Quadriceps) */}
        <mesh position={[0, -0.19, 0]} castShadow>
          <capsuleGeometry args={[0.076, 0.26, 6, 12]} />
          <meshStandardMaterial color={bottomColor} roughness={0.6} />
        </mesh>
        {/* Knee Joint */}
        <mesh position={[0, -0.34, 0.01]} castShadow>
          <sphereGeometry args={[0.068, 10, 10]} />
          <meshStandardMaterial color={bottomColor} roughness={0.6} />
        </mesh>
        {/* Calf */}
        <mesh position={[0, -0.52, 0]} castShadow>
          <capsuleGeometry args={[0.062, 0.28, 6, 12]} />
          <meshStandardMaterial color={bottomColor} roughness={0.6} />
        </mesh>

        {/* Sculpted Sneaker Foot */}
        <group position={[0, -0.82, 0.04]}>
          {/* Midsole / Cushioning */}
          <mesh position={[0, 0.045, 0.02]} scale={[0.072, 0.038, 0.155]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          {/* Rubber Outsole Tread */}
          <mesh position={[0, 0.012, 0.02]} scale={[0.076, 0.02, 0.162]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#09090b" roughness={0.8} />
          </mesh>
          {/* Curved Toe Cap & Upper */}
          <mesh position={[0, 0.07, 0.04]} scale={[0.068, 0.045, 0.13]} castShadow>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color={shoeColor} roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.115, 0.88, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.082, 10, 10]} />
          <meshStandardMaterial color={bottomColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.19, 0]} castShadow>
          <capsuleGeometry args={[0.076, 0.26, 6, 12]} />
          <meshStandardMaterial color={bottomColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.34, 0.01]} castShadow>
          <sphereGeometry args={[0.068, 10, 10]} />
          <meshStandardMaterial color={bottomColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.52, 0]} castShadow>
          <capsuleGeometry args={[0.062, 0.28, 6, 12]} />
          <meshStandardMaterial color={bottomColor} roughness={0.6} />
        </mesh>

        <group position={[0, -0.82, 0.04]}>
          <mesh position={[0, 0.045, 0.02]} scale={[0.072, 0.038, 0.155]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.012, 0.02]} scale={[0.076, 0.02, 0.162]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#09090b" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.07, 0.04]} scale={[0.068, 0.045, 0.13]} castShadow>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color={shoeColor} roughness={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
