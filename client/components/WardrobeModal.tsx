"use client";
import React, { useState } from "react";
import type { WardrobeMessage } from "../../shared/protocol";

const JACKET_OPTIONS = [
  { name: "Chicago Bulls Red", color: "#dc2626", preview: "🔴" },
  { name: "Midnight Bomber", color: "#09090b", preview: "⚫" },
  { name: "Loop Denim Blue", color: "#2563eb", preview: "🔵" },
  { name: "Tactical Olive", color: "#16a34a", preview: "🟢" },
  { name: "Windy City Gold", color: "#facc15", preview: "🟡" },
  { name: "Snow White Puffer", color: "#f8fafc", preview: "⚪" },
  { name: "Cyber Violet", color: "#8b5cf6", preview: "🟣" },
];

const PANTS_OPTIONS = [
  { name: "Dark Raw Denim", color: "#1e293b", preview: "👖" },
  { name: "Shadow Black Cargo", color: "#0f172a", preview: "🖤" },
  { name: "Urban Grey Slim", color: "#475569", preview: "🩶" },
  { name: "Olive Military", color: "#14532d", preview: "🟩" },
  { name: "Sport Trackpants", color: "#1d4ed8", preview: "🟦" },
];

const SNEAKER_OPTIONS = [
  { name: "Triple White Airs", color: "#ffffff", preview: "👟" },
  { name: "Chicago Bred 1s", color: "#dc2626", preview: "🔴" },
  { name: "Stealth Blackout", color: "#09090b", preview: "⚫" },
  { name: "Neon Volt Highs", color: "#22c55e", preview: "⚡" },
  { name: "Royal Blue Drips", color: "#2563eb", preview: "🌊" },
];

export default function WardrobeModal({
  currentJacket = "#dc2626",
  currentPants = "#1e293b",
  currentSneaker = "#ffffff",
  onSave,
  onClose,
}: {
  currentJacket?: string;
  currentPants?: string;
  currentSneaker?: string;
  onSave: (outfit: WardrobeMessage) => void;
  onClose: () => void;
}) {
  const [selectedJacket, setSelectedJacket] = useState(currentJacket);
  const [selectedPants, setSelectedPants] = useState(currentPants);
  const [selectedSneaker, setSelectedSneaker] = useState(currentSneaker);

  const handleApply = () => {
    onSave({
      jacketColor: selectedJacket,
      pantsColor: selectedPants,
      sneakerColor: selectedSneaker,
      hairStyle: "cap",
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "linear-gradient(145deg, #0f172a, #090d16)",
          borderRadius: "20px",
          border: "2px solid #3b82f6",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.35)",
          color: "#ffffff",
          fontFamily: "'Inter', system-ui, sans-serif",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(90deg, rgba(37, 99, 235, 0.2), transparent)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>👔</span>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "0.5px" }}>
                CHICAGO RP WARDROBE
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                Penthouse Safehouse Outfits & Streetwear
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 800,
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* 1. Jackets & Hoodies */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#60a5fa", marginBottom: "8px" }}>
              1. JACKET & HOODIE STYLE
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
              {JACKET_OPTIONS.map((opt) => {
                const isSelected = selectedJacket === opt.color;
                return (
                  <button
                    key={opt.color}
                    onClick={() => setSelectedJacket(opt.color)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      background: isSelected ? "rgba(59, 130, 246, 0.3)" : "rgba(30, 41, 59, 0.6)",
                      border: isSelected ? `2px solid ${opt.color}` : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: opt.color,
                        border: "1px solid #ffffff",
                        display: "inline-block",
                      }}
                    />
                    <span>{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Pants & Jeans */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#60a5fa", marginBottom: "8px" }}>
              2. PANTS & JEANS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
              {PANTS_OPTIONS.map((opt) => {
                const isSelected = selectedPants === opt.color;
                return (
                  <button
                    key={opt.color}
                    onClick={() => setSelectedPants(opt.color)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      background: isSelected ? "rgba(59, 130, 246, 0.3)" : "rgba(30, 41, 59, 0.6)",
                      border: isSelected ? `2px solid ${opt.color}` : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: opt.color,
                        border: "1px solid #ffffff",
                        display: "inline-block",
                      }}
                    />
                    <span>{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Sneakers & Kicks */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#60a5fa", marginBottom: "8px" }}>
              3. SNEAKERS & KICKS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
              {SNEAKER_OPTIONS.map((opt) => {
                const isSelected = selectedSneaker === opt.color;
                return (
                  <button
                    key={opt.name}
                    onClick={() => setSelectedSneaker(opt.color)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      background: isSelected ? "rgba(59, 130, 246, 0.3)" : "rgba(30, 41, 59, 0.6)",
                      border: isSelected ? `2px solid ${opt.color}` : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: opt.color,
                        border: "1px solid #000000",
                        display: "inline-block",
                      }}
                    />
                    <span>{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            background: "rgba(15, 23, 42, 0.95)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#94a3b8",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              border: "1px solid #60a5fa",
              color: "#ffffff",
              borderRadius: "10px",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.5)",
            }}
          >
            EQUIP & SAVE OUTFIT
          </button>
        </div>
      </div>
    </div>
  );
}
