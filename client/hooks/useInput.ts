"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Stance } from "../../shared/protocol";

/**
 * Unified camera-relative input hook:
 * - Movement: W/S/A/D and Arrow keys
 * - Sprint: Shift key (hold)
 * - Jump: Spacebar (impulse)
 * - Crouch: C key (toggle)
 * - Lay / Prone: Z key (toggle)
 * - Virtual joystick support (mobile)
 * - Project vectors relative to current camera yaw
 */
export function useInput(
  send: (
    x: number,
    z: number,
    sprint: boolean,
    jump: boolean,
    stance: Stance
  ) => void,
  getCamYaw?: () => number,
  getInVehicle?: () => boolean
) {
  const localInput = useRef({ right: 0, forward: 0 });
  const keys = useRef(new Set<string>());
  const touchActive = useRef(false);
  const jumpQueued = useRef(false);
  const [stance, setStance] = useState<Stance>("stand");
  const stanceRef = useRef<Stance>("stand");

  // Keep stanceRef in sync with state for access in intervals
  useEffect(() => {
    stanceRef.current = stance;
  }, [stance]);

  const lastSent = useRef({
    x: 99,
    z: 99,
    sprint: false,
    jump: false,
    stance: "stand" as Stance,
    t: 0,
  });

  const recomputeKeyboard = useCallback(() => {
    if (touchActive.current) return;
    const k = keys.current;
    localInput.current = {
      right:
        (k.has("d") || k.has("arrowright") ? 1 : 0) -
        (k.has("a") || k.has("arrowleft") ? 1 : 0),
      forward:
        (k.has("w") || k.has("arrowup") ? 1 : 0) -
        (k.has("s") || k.has("arrowdown") ? 1 : 0),
    };
  }, []);

  /** Called by Joystick component on nipplejs "move" events */
  const setTouchDir = useCallback((right: number, forward: number) => {
    touchActive.current = true;
    localInput.current = { right, forward };
  }, []);

  /** Called by Joystick component on nipplejs "end" events */
  const clearTouch = useCallback(() => {
    touchActive.current = false;
    localInput.current = { right: 0, forward: 0 };
    recomputeKeyboard();
  }, [recomputeKeyboard]);

  /** Manual triggers for mobile action buttons */
  const triggerJump = useCallback(() => {
    if (stanceRef.current === "stand") {
      jumpQueued.current = true;
    } else {
      setStance("stand");
    }
  }, []);

  const toggleCrouch = useCallback(() => {
    setStance((prev) => (prev === "crouch" ? "stand" : "crouch"));
  }, []);

  const toggleProne = useCallback(() => {
    setStance((prev) => (prev === "prone" ? "stand" : "prone"));
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (code === "Space") {
        e.preventDefault();
        if (stanceRef.current === "stand") {
          jumpQueued.current = true;
        } else {
          setStance("stand");
        }
        return;
      }

      if (code === "KeyC") {
        e.preventDefault();
        setStance((prev) => (prev === "crouch" ? "stand" : "crouch"));
        return;
      }

      if (code === "KeyZ") {
        e.preventDefault();
        setStance((prev) => (prev === "prone" ? "stand" : "prone"));
        return;
      }

      keys.current.add(key);
      recomputeKeyboard();
    };

    const ku = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.current.delete(key);
      recomputeKeyboard();
    };

    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    // Send intent at 20Hz
    const iv = setInterval(() => {
      let { right, forward } = localInput.current;
      const len = Math.hypot(right, forward);
      if (len > 1) {
        right /= len;
        forward /= len;
      }

      // Sprint: Shift key held down (only valid while standing on foot)
      const isDriving = getInVehicle ? getInVehicle() : false;
      const currentStance = stanceRef.current;
      const sprint = keys.current.has("shift") && currentStance === "stand" && !isDriving;

      let worldX = 0;
      let worldZ = 0;

      if (isDriving) {
        // Vehicle driving controls: throttle (forward), reverse (-forward), steering (right)
        worldX = right;
        worldZ = forward;
      } else if (len > 0.02) {
        const yaw = getCamYaw ? getCamYaw() : 0;
        // Camera forward in XZ plane: (-sin(yaw), -cos(yaw))
        // Camera right in XZ plane: (cos(yaw), -sin(yaw))
        const fwdX = -Math.sin(yaw);
        const fwdZ = -Math.cos(yaw);
        const rgtX = Math.cos(yaw);
        const rgtZ = -Math.sin(yaw);

        worldX = fwdX * forward + rgtX * right;
        worldZ = fwdZ * forward + rgtZ * right;

        const wLen = Math.hypot(worldX, worldZ);
        if (wLen > 1) {
          worldX /= wLen;
          worldZ /= wLen;
        }
      }

      const willJump = jumpQueued.current;
      jumpQueued.current = false; // consume jump intent

      const l = lastSent.current;
      const now = performance.now();
      if (
        Math.abs(worldX - l.x) > 0.02 ||
        Math.abs(worldZ - l.z) > 0.02 ||
        sprint !== l.sprint ||
        willJump ||
        currentStance !== l.stance ||
        now - l.t > 1000
      ) {
        send(worldX, worldZ, sprint, willJump, currentStance);
        lastSent.current = {
          x: worldX,
          z: worldZ,
          sprint,
          jump: willJump,
          stance: currentStance,
          t: now,
        };
      }
    }, 50);

    return () => {
      clearInterval(iv);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [send, getCamYaw, recomputeKeyboard]);

  return {
    stance,
    setTouchDir,
    clearTouch,
    triggerJump,
    toggleCrouch,
    toggleProne,
  };
}
