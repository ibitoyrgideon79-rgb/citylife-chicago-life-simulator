"use client";
import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Net } from "../types/network";

/**
 * GTA-Style Third-Person Chase Camera with Pointer Lock:
 * - Click the canvas to lock the mouse (Pointer Lock API). ESC to unlock.
 * - When locked: mouse movement freely controls camera yaw & pitch.
 * - When unlocked: drag to orbit (fallback for touch / mobile).
 * - Smooth auto-centering behind the player's movement when not manually looking.
 * - Emits onYawChange so useInput can project WASD/joystick relative to the camera.
 */
export default function FollowCam({
  net,
  onYawChange,
  zoomDistance,
}: {
  net: Net;
  onYawChange?: (yaw: number) => void;
  zoomDistance: MutableRefObject<number>;
}) {
  const { camera, gl } = useThree();

  const targetPos = useRef(new THREE.Vector3());
  const camPos = useRef(new THREE.Vector3(0, 3, 5));
  const yaw = useRef(0); // horizontal orbit angle (radians)
  const pitch = useRef(0.22); // slight downward pitch (~13 deg)
  const smoothedDistance = useRef(5);
  const isDragging = useRef(false);
  const isLocked = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastPlayerPos = useRef({ x: 0, z: 0 });

  useEffect(() => {
    const dom = gl.domElement;

    // ──────────────────── Pointer Lock ────────────────────
    const onPointerLockChange = () => {
      isLocked.current = document.pointerLockElement === dom;
    };

    // Click canvas to request pointer lock
    const onClick = (e: MouseEvent) => {
      // Don't lock if clicking UI overlays (joystick, HUD, etc.)
      if ((e.target as HTMLElement)?.closest?.(".mobile-joystick, header, footer, aside")) return;
      if (!isLocked.current) {
        dom.requestPointerLock();
      }
    };

    // Handle mouse movement — works for both locked and dragged modes
    const onMouseMove = (e: MouseEvent) => {
      if (isLocked.current) {
        // Pointer Lock: use movementX/Y (infinite, no boundaries)
        yaw.current -= e.movementX * 0.003;
        pitch.current = Math.max(0.04, Math.min(0.65, pitch.current + e.movementY * 0.003));
      } else if (isDragging.current) {
        // Fallback drag mode (mobile / unlocked)
        const dx = e.clientX - lastPointer.current.x;
        const dy = e.clientY - lastPointer.current.y;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        yaw.current -= dx * 0.006;
        pitch.current = Math.max(0.04, Math.min(0.65, pitch.current + dy * 0.005));
      }
    };

    // ──────────────────── Drag Fallback (touch/mobile) ────────────────────
    const onPointerDown = (e: PointerEvent) => {
      if (isLocked.current) return; // pointer lock handles camera
      if ((e.target as HTMLElement)?.closest?.(".mobile-joystick, header, footer, aside")) return;
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isLocked.current) return;
      if (!isDragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      yaw.current -= dx * 0.006;
      pitch.current = Math.max(0.04, Math.min(0.65, pitch.current + dy * 0.005));
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomDistance.current = THREE.MathUtils.clamp(
        zoomDistance.current + e.deltaY * 0.16,
        3,
        420,
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "CapsLock") {
        e.preventDefault();
        if (document.pointerLockElement) {
          document.exitPointerLock();
        } else {
          dom.requestPointerLock();
        }
      }
    };

    // Register all listeners
    document.addEventListener("pointerlockchange", onPointerLockChange);
    window.addEventListener("keydown", onKeyDown);
    dom.addEventListener("click", onClick);
    dom.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("mousemove", onMouseMove);
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      window.removeEventListener("keydown", onKeyDown);
      dom.removeEventListener("click", onClick);
      dom.removeEventListener("wheel", onWheel);
      document.removeEventListener("mousemove", onMouseMove);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const p = net.me ? net.pos.get(net.me) : null;
    if (!p) return;

    // Track movement for auto-camera swing when not manually looking
    const dx = p.x - lastPlayerPos.current.x;
    const dz = p.z - lastPlayerPos.current.z;
    const speed = Math.hypot(dx, dz) / Math.max(0.001, dt);

    // Only auto-center behind the player if neither pointer-locked nor dragging
    if (speed > 1.2 && !isDragging.current && !isLocked.current) {
      const desiredYaw = Math.atan2(dx, dz);
      let diff = desiredYaw - yaw.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      yaw.current += diff * Math.min(1, dt * 2.0);
    }

    lastPlayerPos.current = { x: p.x, z: p.z };
    onYawChange?.(yaw.current);

    // Smoothly track player position (including elevation and stance)
    const followSpeed = Math.min(1, dt * 8);
    const py = p.y ?? 0;
    const stanceOffset = p.stance === "prone" ? -0.7 : p.stance === "crouch" ? -0.35 : 0;
    targetPos.current.x = THREE.MathUtils.lerp(targetPos.current.x, p.x, followSpeed);
    targetPos.current.y = THREE.MathUtils.lerp(targetPos.current.y, py + stanceOffset, followSpeed);
    targetPos.current.z = THREE.MathUtils.lerp(targetPos.current.z, p.z, followSpeed);

    // GTA Camera Distance & Height (expands when driving, tighter when inside apartment)
    const inVehicle = !!p.vehicleId;
    const isApartment = p.interior === "apartment_loft";
    const defaultDist = inVehicle ? 8.2 : isApartment ? 3.6 : 5.0;
    const maxDist = isApartment ? 9 : inVehicle ? 420 : 420;
    const desiredDist = THREE.MathUtils.clamp(zoomDistance.current, isApartment ? 2.4 : inVehicle ? 6.5 : 3, maxDist);
    zoomDistance.current = desiredDist;
    smoothedDistance.current = THREE.MathUtils.lerp(smoothedDistance.current, desiredDist || defaultDist, Math.min(1, dt * 7));
    const dist = smoothedDistance.current;
    const height = inVehicle ? 3.4 : isApartment ? 1.5 : 2.3;
    const effectivePitch = Math.min(0.72, pitch.current + Math.max(0, dist - defaultDist) * 0.0012);

    const idealX = targetPos.current.x + Math.sin(yaw.current) * dist * Math.cos(effectivePitch);
    const idealY = 1.4 + height + Math.sin(effectivePitch) * dist + targetPos.current.y * 0.7;
    const idealZ = targetPos.current.z + Math.cos(yaw.current) * dist * Math.cos(effectivePitch);

    // Smooth camera lag
    const camLerp = Math.min(1, dt * 10);
    camPos.current.x = THREE.MathUtils.lerp(camPos.current.x, idealX, camLerp);
    camPos.current.y = THREE.MathUtils.lerp(camPos.current.y, idealY, camLerp);
    camPos.current.z = THREE.MathUtils.lerp(camPos.current.z, idealZ, camLerp);

    camera.position.copy(camPos.current);

    // Look at player chest/eye level
    const lookTarget = new THREE.Vector3(
      targetPos.current.x,
      1.4 + targetPos.current.y,
      targetPos.current.z
    );
    camera.lookAt(lookTarget);
  });

  return null;
}
