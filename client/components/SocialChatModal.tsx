"use client";

import React, { useEffect, useRef, useState } from "react";
import type { SocialChatEvent } from "../../shared/protocol";

export default function SocialChatModal({
  messages,
  playerId,
  onSend,
  onClose,
}: {
  messages: SocialChatEvent[];
  playerId: string | null;
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Talk to nearby players" style={{
      position: "fixed", inset: 0, zIndex: 92, display: "grid", placeItems: "center", padding: 16,
      background: "rgba(2,6,23,.76)", fontFamily: "system-ui, sans-serif",
    }}>
      <section style={{ width: "min(480px,100%)", height: "min(580px,85dvh)", display: "flex", flexDirection: "column", borderRadius: 16, background: "#0f172a", border: "1px solid #475569", color: "#f8fafc", padding: 16 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><strong>Nearby conversation</strong><div style={{ color: "#94a3b8", fontSize: 12 }}>Only players within 30 m can hear you.</div></div>
          <button onClick={onClose} style={buttonStyle}>Close</button>
        </header>
        <div aria-live="polite" style={{ overflowY: "auto", flex: 1, padding: "12px 2px", marginTop: 8 }}>
          {messages.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13 }}>No nearby messages yet. Say hello to players around you.</p>}
          {messages.map((message, index) => (
            <p key={`${message.senderId}_${index}`} style={{ margin: "8px 0", lineHeight: 1.45 }}>
              <strong style={{ color: message.senderId === playerId ? "#4ade80" : "#38bdf8" }}>{message.senderName}: </strong>
              <span>{message.text}</span>
            </p>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={(event) => {
          event.preventDefault();
          const value = draft.trim();
          if (!value) return;
          onSend(value.slice(0, 120));
          setDraft("");
        }} style={{ display: "flex", gap: 8 }}>
          <input
            aria-label="Conversation message"
            maxLength={120}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message nearby players..."
            style={{ minWidth: 0, flex: 1, borderRadius: 8, padding: 10, color: "#fff", background: "#1e293b", border: "1px solid #475569" }}
          />
          <button type="submit" style={{ ...buttonStyle, background: "#0369a1" }}>Send</button>
        </form>
      </section>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  border: "1px solid #475569", borderRadius: 8, padding: "8px 11px", background: "#1e293b",
  color: "#f8fafc", fontWeight: 700, cursor: "pointer",
};
