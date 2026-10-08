"use client";

import React from "react";
import { HOUSING_PROPERTIES, type HousingMessage } from "../../shared/protocol";

const panel: React.CSSProperties = {
  background: "#0f172a",
  color: "#f8fafc",
  border: "1px solid #475569",
  borderRadius: 16,
  padding: 18,
  fontFamily: "system-ui, sans-serif",
};

export default function HousingMarketModal({
  money,
  homeId,
  homeTenure,
  leaseEndsAt,
  millionaireOffer,
  onApply,
  onVacate,
  onGoHome,
  onClose,
}: {
  money: number;
  homeId: string;
  homeTenure: string;
  leaseEndsAt: number;
  millionaireOffer: boolean;
  onApply: (request: HousingMessage) => void;
  onVacate: () => void;
  onGoHome: () => void;
  onClose: () => void;
}) {
  const currentHome = HOUSING_PROPERTIES.find((property) => property.id === homeId);

  return (
    <div role="dialog" aria-modal="true" aria-label="Chicago housing market" style={{
      position: "fixed", inset: 0, zIndex: 90, display: "grid", placeItems: "center", padding: 16,
      background: "rgba(2,6,23,.86)", backdropFilter: "blur(10px)", fontFamily: "system-ui, sans-serif",
    }}>
      <section style={{ ...panel, width: "min(760px,100%)", maxHeight: "90dvh", overflowY: "auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ color: "#38bdf8", fontWeight: 800, letterSpacing: 1 }}>CHICAGO HOUSING</div>
            <h2 style={{ margin: "4px 0" }}>Rent or own a place to live</h2>
            <p style={{ color: "#cbd5e1", fontSize: 13, marginTop: 4 }}>
              Your balance: <strong>${Math.floor(money).toLocaleString()}</strong>. Renting requires one week&apos;s rent plus an equal refundable deposit, paid upfront. Renew manually each week; rent is never silently auto-charged.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close housing market" style={buttonStyle}>CLOSE</button>
        </header>

        {millionaireOffer && (
          <div role="status" style={{ margin: "14px 0", padding: 14, borderRadius: 12, background: "linear-gradient(120deg,#713f12,#854d0e)", border: "1px solid #fbbf24" }}>
            <strong>Congratulations—you have reached $1,000,000!</strong>
            <div style={{ fontSize: 13, marginTop: 4 }}>Want to move into the Gold Coast elite area? The penthouse below costs $1,000,000 to buy.</div>
          </div>
        )}

        {currentHome && (
          <div style={{ ...panel, padding: 14, margin: "12px 0", background: "#172554" }}>
            <strong>{currentHome.name}</strong> · {currentHome.neighborhood} · {homeTenure === "owner" ? "Owned" : "Rented"}
            {homeTenure === "tenant" && (
              <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>
                Lease {leaseEndsAt > Date.now() ? `ends ${new Date(leaseEndsAt).toLocaleDateString()}` : "expired; renew by renting again"}.
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={onGoHome} style={{ ...buttonStyle, background: "#0369a1" }}>Go home</button>
              <button onClick={onVacate} style={{ ...buttonStyle, background: "#7f1d1d" }}>
                Move out · {homeTenure === "owner" ? "sell for 80%" : "get deposit back"}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {HOUSING_PROPERTIES.map((property) => {
            const rentCost = property.weeklyRent * 2;
            const isCurrent = homeId === property.id;
            return (
              <article key={property.id} style={{ ...panel, padding: 14, background: "#111c30" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <div>
                    <strong>{property.name}</strong> <span style={{ color: "#94a3b8" }}>· {property.neighborhood}</span>
                    <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4, textTransform: "capitalize" }}>{property.kind} · Rent ${property.weeklyRent.toLocaleString()}/week · Buy ${property.purchasePrice.toLocaleString()}</div>
                  </div>
                  {property.purchasePrice === 1_000_000 && <span aria-label="Millionaire milestone">⭐</span>}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  <button
                    disabled={isCurrent || !!homeId || money < rentCost}
                    onClick={() => onApply({ propertyId: property.id, tenure: "rent" })}
                    style={buttonStyle}
                    title={`One week rent plus one week refundable deposit: $${rentCost.toLocaleString()}`}
                  >
                    Rent · ${rentCost.toLocaleString()} upfront
                  </button>
                  <button
                    disabled={isCurrent || !!homeId || money < property.purchasePrice}
                    onClick={() => onApply({ propertyId: property.id, tenure: "buy" })}
                    style={{ ...buttonStyle, background: "#14532d", borderColor: "#166534" }}
                  >
                    Buy · ${property.purchasePrice.toLocaleString()}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {homeId && <p style={{ color: "#94a3b8", fontSize: 12 }}>To switch homes, move out first. Buying returns 80% of the purchase price on resale; leaving a rental returns its security deposit.</p>}
      </section>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  border: "1px solid #475569", borderRadius: 8, padding: "8px 11px", background: "#1e293b",
  color: "#f8fafc", fontWeight: 700, cursor: "pointer",
};
