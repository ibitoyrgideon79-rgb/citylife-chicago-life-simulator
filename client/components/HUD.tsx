"use client";
import React, { useState, useEffect } from "react";
import type { POIDefinition, ToastMessage } from "../../shared/protocol";

const hudActionButton = (background: string): React.CSSProperties => ({
  background,
  color: "#fff",
  border: "1px solid rgba(255,255,255,.4)",
  borderRadius: 8,
  padding: "7px 10px",
  fontSize: 10,
  fontWeight: 900,
  whiteSpace: "nowrap",
  cursor: "pointer",
});

/**
 * GTA-Style HUD & Radar:
 * - Top-Right: Iconic GTA green cash counter with live balance & in-game clock
 * - Top-Center: Interactive Toast Notification banners (credits, debits, shift pay)
 * - Bottom-Center: Proximity Interaction prompt bar (`[E] INTERACT: ...`)
 * - Bottom-Left: Circular GTA Radar / Minimap with health/armor bars & player blip
 * - Top-Left: Live server connection & online players pill
 */
export default function HUD({
  status,
  playerCount,
  money = 1500,
  toast,
  activePoi,
  onInteract,
  profession,
  company,
  health = 100,
  energy = 100,
  hunger = 85,
  thirst = 85,
  onOpenMap,
  onOpenCareer,
  onEatFood,
  onDrinkBeverage,
  onOpenHousing,
  onOpenChat,
  homeName,
  homeTenure,
  wantedLevel = 0,
  educationLevel = 0,
  rideStatus = "",
  rideEtaAt = 0,
  rideFare = 0,
  medicalStatus = "",
  onUberBoard,
  onUberCancel,
  onUberToWork,
  onHospitalDischarge,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: {
  status: string;
  playerCount: number;
  money?: number;
  toast?: ToastMessage | null;
  activePoi?: POIDefinition | null;
  onInteract?: () => void;
  profession?: string;
  company?: string;
  health?: number;
  energy?: number;
  hunger?: number;
  thirst?: number;
  onOpenMap?: () => void;
  onOpenCareer?: () => void;
  onEatFood?: () => void;
  onDrinkBeverage?: () => void;
  onOpenHousing?: () => void;
  onOpenChat?: () => void;
  homeName?: string;
  homeTenure?: string;
  wantedLevel?: number;
  educationLevel?: number;
  rideStatus?: string;
  rideEtaAt?: number;
  rideFare?: number;
  medicalStatus?: string;
  onUberBoard?: () => void;
  onUberCancel?: () => void;
  onUberToWork?: () => void;
  onHospitalDischarge?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
}) {
  const isOnline = status === "online";
  const [time, setTime] = useState("14:20");
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!rideStatus) return;
    const interval = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(interval);
  }, [rideStatus]);

  const formattedMoney = String(Math.max(0, Math.floor(money))).padStart(8, "0");
  const rideSeconds = Math.max(0, Math.ceil((rideEtaAt - nowMs) / 1000));

  return (
    <>
      {/* === TOP BAR === */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          padding: "12px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 40,
        }}
      >
        {/* Top-Left: Server Status & Citizens */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "6px 14px",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
            color: "#fff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "12px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isOnline ? "#10b981" : "#ef4444",
              boxShadow: isOnline ? "0 0 8px #10b981" : "0 0 8px #ef4444",
            }}
          />
          <span style={{ fontWeight: 600 }}>{status}</span>
          <span style={{ opacity: 0.35 }}>|</span>
          <span style={{ color: "#38bdf8", fontWeight: 600 }}>
            👥 {playerCount} {playerCount === 1 ? "Player" : "Players"}
          </span>
        </div>

        {/* Top-Center: Live Animated Toast Notification Banner */}
        {toast && (
          <div
            style={{
              background:
                toast.type === "success"
                  ? "linear-gradient(135deg, rgba(22, 101, 52, 0.95), rgba(21, 128, 61, 0.95))"
                  : toast.type === "warning"
                  ? "linear-gradient(135deg, rgba(161, 98, 7, 0.95), rgba(180, 83, 9, 0.95))"
                  : "linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(30, 58, 138, 0.95))",
              padding: "10px 22px",
              borderRadius: "14px",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 800,
              fontFamily: "system-ui, sans-serif",
              border: "1.5px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
              animation: "fadeIn 0.3s ease",
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>{toast.type === "success" ? "💰" : toast.type === "warning" ? "⚠️" : "ℹ️"}</span>
            <span>{toast.text}</span>
            {toast.delta !== undefined && (
              <span
                style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  color: toast.delta > 0 ? "#4ade80" : "#fca5a5",
                }}
              >
                {toast.delta > 0 ? `+$${toast.delta}` : `-$${Math.abs(toast.delta)}`}
              </span>
            )}
          </div>
        )}

        {/* Top-Right: Classic GTA Green Money & Clock */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "4px",
            fontFamily: "'Arial Black', Impact, system-ui, sans-serif",
          }}
        >
          {/* Cash Display */}
          <div
            style={{
              color: "#4ade80",
              fontSize: "clamp(22px, 5vw, 32px)",
              letterSpacing: "1px",
              textShadow:
                "2px 2px 0px #052e16, -1px -1px 0px #052e16, 1px -1px 0px #052e16, -1px 1px 0px #052e16, 0 3px 6px rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <span>$</span>
            <span>{formattedMoney}</span>
          </div>

          {/* Clock & Location Subtext */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(6px)",
              padding: "3px 10px",
              borderRadius: "6px",
              color: "#f8fafc",
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.5px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            🕒 {time} · <span style={{ color: "#fbbf24" }}>THE LOOP</span>
          </div>
          {wantedLevel > 0 && (
            <div role="status" aria-label={`Police wanted level ${wantedLevel} of 5`} style={{
              background: "rgba(127, 29, 29, 0.9)", color: "#fecaca", border: "1px solid #ef4444",
              borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 800, fontFamily: "system-ui, sans-serif",
            }}>
              🚨 WANTED {"★".repeat(Math.min(5, wantedLevel))}
            </div>
          )}

          {/* Career & Company Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(6px)",
              padding: "4px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              pointerEvents: "auto",
            }}
          >
            <span style={{ fontSize: "14px" }}>💼</span>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8" }}>
                {profession || "Citizen"}
              </div>
              <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                {company || "Unemployed / Looking"}
              </div>
              {educationLevel > 0 && (
                <div style={{ fontSize: "10px", color: "#86efac" }}>🎓 Education level {educationLevel}</div>
              )}
            </div>
            <button
              onClick={onOpenCareer}
              style={{
                background: "rgba(56, 189, 248, 0.2)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                borderRadius: "5px",
                padding: "2px 6px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
                marginLeft: "4px",
              }}
            >
              CHANGE [P]
            </button>
          </div>

          {/* Quick HUD Navigation & Consumable Buttons */}
          <div style={{ display: "flex", gap: "6px", pointerEvents: "auto", marginTop: "2px" }}>
            <button
              onClick={onOpenMap}
              style={{
                background: "linear-gradient(135deg, #0284c7, #0369a1)",
                color: "#fff",
                border: "1px solid #38bdf8",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
              title="Open Chicago City Map [M]"
            >
              🗺️ MAP [M]
            </button>
            <button
              onClick={onEatFood}
              style={{
                background: "rgba(30, 41, 59, 0.85)",
                color: "#f97316",
                border: "1px solid rgba(249, 115, 22, 0.4)",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Eat Food (-$12, +Hunger & Health)"
            >
              🍕 EAT
            </button>
            <button
              onClick={onDrinkBeverage}
              style={{
                background: "rgba(30, 41, 59, 0.85)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Drink Beverage (-$5, +Thirst & Energy)"
            >
              🥤 DRINK
            </button>
            <button
              onClick={onOpenHousing}
              style={{
                background: "rgba(30, 41, 59, 0.9)",
                color: "#fbbf24",
                border: "1px solid rgba(251, 191, 36, 0.45)",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Rent, buy, or manage your home"
            >
              🏠 HOME
            </button>
            <button
              onClick={onOpenChat}
              style={{
                background: "rgba(30, 41, 59, 0.9)",
                color: "#a5f3fc",
                border: "1px solid rgba(103, 232, 249, 0.45)",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Talk to nearby players [T]"
            >
              💬 TALK
            </button>
          </div>
          {homeName && (
            <div style={{ color: "#fcd34d", fontSize: 10, textAlign: "right", marginTop: 3 }}>
              🏠 {homeName} · {homeTenure === "owner" ? "OWNER" : "TENANT"}
            </div>
          )}
          {company && onUberToWork && (
            <button
              onClick={onUberToWork}
              style={{
                marginTop: 4,
                background: "linear-gradient(135deg, #111827, #374151)",
                color: "#f8fafc",
                border: "1px solid #94a3b8",
                borderRadius: 7,
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 800,
                cursor: "pointer",
                pointerEvents: "auto",
              }}
            >
              🚕 UBER TO WORK
            </button>
          )}
        </div>
      </header>

      <div
        aria-label="Camera zoom controls"
        style={{
          position: "fixed",
          top: 62,
          left: 18,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 4,
          borderRadius: 9,
          background: "rgba(15,23,42,.8)",
          border: "1px solid rgba(148,163,184,.4)",
          zIndex: 42,
        }}
      >
        <button onClick={onZoomIn} aria-label="Zoom camera in" style={hudActionButton("#334155")}>−</button>
        <button onClick={onZoomOut} aria-label="Zoom camera out" style={hudActionButton("#334155")}>+</button>
        <button onClick={onZoomReset} style={hudActionButton("#0369a1")}>RESET VIEW</button>
      </div>

      {(rideStatus || medicalStatus) && (
        <section
          role="status"
          style={{
            position: "fixed",
            top: 92,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: "min(94vw, 540px)",
            padding: "11px 16px",
            borderRadius: 14,
            background: medicalStatus ? "rgba(127,29,29,.95)" : "rgba(15,23,42,.95)",
            color: "#f8fafc",
            border: `1.5px solid ${medicalStatus ? "#f87171" : "#38bdf8"}`,
            boxShadow: "0 8px 28px rgba(0,0,0,.5)",
            font: "700 13px system-ui",
            zIndex: 55,
          }}
        >
          <span>
            {medicalStatus === "ambulance"
              ? "🚑 Paramedics responding"
              : medicalStatus === "hospital"
                ? "🏥 Stabilized in a hospital bed"
                : rideStatus === "enroute"
                  ? `🚕 Uber arriving in ${rideSeconds}s · $${rideFare.toFixed(2)} due at drop-off`
                  : rideStatus === "arrived"
                    ? "🚨 Your Uber is here and signaling. Walk to it, then board."
                    : `🚕 Uber trip · about ${rideSeconds}s to destination`}
          </span>
          {rideStatus === "arrived" && (
            <button onClick={onUberBoard} style={hudActionButton("#16a34a")}>BOARD [F]</button>
          )}
          {(rideStatus === "enroute" || rideStatus === "arrived") && (
            <button onClick={onUberCancel} style={hudActionButton("#7f1d1d")}>CANCEL</button>
          )}
          {medicalStatus === "hospital" && (
            <button onClick={onHospitalDischarge} style={hudActionButton("#0369a1")}>DISCHARGE [F]</button>
          )}
        </section>
      )}

      {/* === BOTTOM-CENTER: INTERACTIVE PROXIMITY PROMPT BANNER === */}
      {activePoi && (
        <div
          style={{
            position: "fixed",
            bottom: "96px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.94)",
            border: "2px solid #38bdf8",
            borderRadius: "16px",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 8px 30px rgba(56, 189, 248, 0.5)",
            backdropFilter: "blur(12px)",
            zIndex: 50,
            userSelect: "none",
          }}
        >
          <span style={{ fontSize: "24px" }}>{activePoi.icon}</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>
              {activePoi.name}
            </span>
            <span style={{ fontSize: "15px", color: "#ffffff", fontWeight: 800 }}>
              {activePoi.actionText}
            </span>
          </div>
          <button
            onClick={onInteract}
            style={{
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              border: "1.5px solid #7dd3fc",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              letterSpacing: "0.5px",
            }}
          >
            PRESS [E] / TAP
          </button>
        </div>
      )}

      {/* === BOTTOM-LEFT: GTA RADAR / MINIMAP === */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 35,
        }}
      >
        {/* Radar Circular Screen - Clickable to open full city map */}
        <div
          onClick={onOpenMap}
          style={{
            position: "relative",
            width: 130,
            height: 130,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(15, 23, 42, 0.85) 0%, rgba(9, 14, 26, 0.95) 100%)",
            border: "3px solid rgba(56, 189, 248, 0.5)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.6), inset 0 0 16px rgba(0,0,0,0.8)",
            overflow: "hidden",
            cursor: "pointer",
            pointerEvents: "auto",
          }}
          title="Click to Zoom Full Chicago Map [M]"
        >
          {/* Compass North Arrow */}
          <div
            style={{
              position: "absolute",
              top: 6,
              left: "50%",
              transform: "translateX(-50%)",
              color: "#ef4444",
              fontWeight: 900,
              fontSize: "11px",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            N
          </div>

          {/* Grid Lines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.15) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              backgroundPosition: "center center",
            }}
          />

          {/* Player Center Blip */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 10,
              height: 10,
              background: "#38bdf8",
              border: "2px solid #ffffff",
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 8px #38bdf8",
            }}
          />

          {/* Map Overlay Text Hint */}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "9px",
              fontWeight: 800,
              color: "#38bdf8",
              background: "rgba(15, 23, 42, 0.85)",
              padding: "1px 5px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
            }}
          >
            MAP [M]
          </div>
        </div>

        {/* 4-Tier Player Needs Meters: Health, Energy, Hunger, Thirst */}
        <div
          style={{
            width: 130,
            display: "flex",
            flexDirection: "column",
            gap: "3px",
            background: "rgba(15, 23, 42, 0.8)",
            padding: "4px 6px",
            borderRadius: "6px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Health Bar (Red/Green) */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", color: "#4ade80", fontWeight: 700 }}>
            <span style={{ width: 14 }}>HP</span>
            <div style={{ flex: 1, height: 5, background: "rgba(0,0,0,0.6)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(0, health)}%`, height: "100%", background: health > 30 ? "#22c55e" : "#ef4444" }} />
            </div>
            <span style={{ width: 22, textAlign: "right" }}>{Math.round(health)}</span>
          </div>

          {/* Energy Bar (Yellow/Blue) */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", color: "#facc15", fontWeight: 700 }}>
            <span style={{ width: 14 }}>NRG</span>
            <div style={{ flex: 1, height: 5, background: "rgba(0,0,0,0.6)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(0, energy)}%`, height: "100%", background: "#eab308" }} />
            </div>
            <span style={{ width: 22, textAlign: "right" }}>{Math.round(energy)}</span>
          </div>

          {/* Hunger Bar (Orange) */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", color: "#fb923c", fontWeight: 700 }}>
            <span style={{ width: 14 }}>FOOD</span>
            <div style={{ flex: 1, height: 5, background: "rgba(0,0,0,0.6)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(0, hunger)}%`, height: "100%", background: "#f97316" }} />
            </div>
            <span style={{ width: 22, textAlign: "right" }}>{Math.round(hunger)}</span>
          </div>

          {/* Thirst Bar (Cyan) */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", color: "#38bdf8", fontWeight: 700 }}>
            <span style={{ width: 14 }}>H2O</span>
            <div style={{ flex: 1, height: 5, background: "rgba(0,0,0,0.6)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(0, thirst)}%`, height: "100%", background: "#06b6d4" }} />
            </div>
            <span style={{ width: 22, textAlign: "right" }}>{Math.round(thirst)}</span>
          </div>
        </div>
      </div>

      {/* Disconnection Warning Modal */}
      {!isOnline && (
        <aside
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 60,
            pointerEvents: "none",
            backgroundColor: "rgba(11, 16, 25, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              background: "rgba(15, 23, 42, 0.95)",
              color: "#fff",
              padding: "24px 36px",
              borderRadius: "16px",
              fontFamily: "system-ui, sans-serif",
              fontSize: "16px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.7)",
            }}
          >
            <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>
              {status.startsWith("reconnecting") ? "🔄" : "⚠️"}
            </div>
            <div style={{ fontWeight: 800, color: "#facc15", marginBottom: "4px" }}>
              {status.startsWith("reconnecting") ? "RECONNECTING TO CHICAGO…" : "CONNECTION LOST"}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>{status}</div>
          </div>
        </aside>
      )}
    </>
  );
}
