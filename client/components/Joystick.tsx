"use client";
import { useEffect, useRef } from "react";
import nipplejs from "nipplejs";

type Props = {
  onMove: (right: number, forward: number) => void;
  onEnd: () => void;
};

/**
 * Touch virtual joystick overlay using nipplejs:
 * Outputs local joystick vector:
 * - right: -1 (left) to +1 (right)
 * - forward: -1 (pull back) to +1 (push forward)
 * The parent useInput hook projects this vector relative to camera viewing angle.
 */
export default function Joystick({ onMove, onEnd }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const managerRef = useRef<any>(null);
  const onMoveRef = useRef(onMove);
  const onEndRef = useRef(onEnd);
  onMoveRef.current = onMove;
  onEndRef.current = onEnd;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manager: any = nipplejs.create({
      zone: el,
      mode: "static",
      position: { left: "50%", bottom: "50%" },
      size: 110,
      color: "rgba(255, 255, 255, 0.45)",
      restOpacity: 0.55,
    });
    managerRef.current = manager;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    manager.on("move", (_evt: unknown, data: any) => {
      if (!data?.vector) return;
      const f = Math.min(data.force ?? 1, 1);
      const right = (data.vector.x ?? 0) * f;
      const forward = (data.vector.y ?? 0) * f; // nipplejs Y-up = forward
      onMoveRef.current(right, forward);
    });

    manager.on("end", () => {
      onEndRef.current();
    });

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-label="Virtual joystick"
      className="mobile-joystick"
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        width: 130,
        height: 130,
        zIndex: 25,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
        pointerEvents: "auto",
      }}
    />
  );
}
