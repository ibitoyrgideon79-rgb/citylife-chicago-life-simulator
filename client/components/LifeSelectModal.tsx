"use client";
import React, { useState } from "react";
import {
  PROFESSIONS,
  MSG,
  type LifeSelectMessage,
  type ProfessionConfig,
  type Gender,
} from "../../shared/protocol";
import type { Net } from "../types/network";

export default function LifeSelectModal({
  net,
  onClose,
  onGenderSelected,
}: {
  net: Net;
  onClose: () => void;
  onGenderSelected?: (gender: Gender) => void;
}) {
  const [selectedProfId, setSelectedProfId] = useState<string>("software_engineer");
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState<number>(0);
  const [gender, setGender] = useState<Gender>("male");
  const [name, setName] = useState<string>("Chicago Citizen");

  const selectedProf =
    PROFESSIONS.find((p) => p.id === selectedProfId) || PROFESSIONS[0];
  const selectedCompany = selectedProf.companies[selectedCompanyIdx];

  const handleConfirm = () => {
    if (!net.room) return;
    net.room.send(MSG.life_select, {
      gender,
      professionId: selectedProf.id,
      companyId: selectedCompany.name,
      characterName: name.trim() || "Citizen",
    } satisfies LifeSelectMessage);
    onGenderSelected?.(gender);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        backgroundColor: "rgba(3, 7, 18, 0.88)",
        backgroundImage:
          "linear-gradient(90deg, rgba(3, 7, 18, 0.87), rgba(3, 7, 18, 0.45)), url('/images/chicago-skyline.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1020px",
          maxHeight: "92vh",
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          border: "1.5px solid rgba(56, 189, 248, 0.35)",
          borderRadius: "20px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "22px 28px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            background: "linear-gradient(90deg, rgba(30, 58, 138, 0.6), rgba(15, 23, 42, 0.8))",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>🏙️</span>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, letterSpacing: "0.5px" }}>
                CHOOSE YOUR CHICAGO LIFE
              </h2>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>
              Select your career path, institution, and identity in the Windy City.
            </p>
          </div>

          {/* Identity controls: Name & Gender */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character Name"
              maxLength={16}
              style={{
                background: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "8px 14px",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                outline: "none",
              }}
            />
            <div style={{ display: "flex", background: "rgba(30, 41, 59, 0.8)", borderRadius: "8px", padding: "3px" }}>
              <button
                onClick={() => setGender("male")}
                style={{
                  background: gender === "male" ? "#0284c7" : "transparent",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                MALE
              </button>
              <button
                onClick={() => setGender("female")}
                style={{
                  background: gender === "female" ? "#ec4899" : "transparent",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                FEMALE
              </button>
            </div>
          </div>
        </div>

        {/* Body Split View */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left: Professions Scroll List */}
          <div
            style={{
              width: "48%",
              borderRight: "1px solid rgba(255, 255, 255, 0.1)",
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
              {PROFESSIONS.length} Available Chicago Careers
            </div>
            {PROFESSIONS.map((prof) => {
              const isSelected = prof.id === selectedProfId;
              return (
                <div
                  key={prof.id}
                  onClick={() => {
                    setSelectedProfId(prof.id);
                    setSelectedCompanyIdx(0);
                  }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: isSelected
                      ? "linear-gradient(90deg, rgba(2, 132, 199, 0.4), rgba(30, 58, 138, 0.25))"
                      : "rgba(30, 41, 59, 0.45)",
                    border: isSelected ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.08)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>{prof.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: isSelected ? "#38bdf8" : "#fff" }}>
                        {prof.title}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {prof.category} · {prof.companies.length} Companies
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#4ade80", fontWeight: 800, fontSize: "13px" }}>
                      ${prof.startingSalary}/shift
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748b" }}>Signing Bonus +$350</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Career Details & 3 Companies */}
          <div
            style={{
              width: "52%",
              padding: "24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              background: "rgba(15, 23, 42, 0.6)",
            }}
          >
            {/* Header info */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "32px" }}>{selectedProf.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#fff" }}>
                    {selectedProf.title}
                  </h3>
                  <span
                    style={{
                      background: "rgba(56, 189, 248, 0.15)",
                      color: "#38bdf8",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {selectedProf.category}
                  </span>
                </div>
              </div>
              <p style={{ margin: "10px 0 0 0", fontSize: "13px", color: "#cbd5e1", lineHeight: 1.5 }}>
                {selectedProf.description}
              </p>
            </div>

            {/* Select 1 of 3 Companies */}
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "10px", letterSpacing: "0.5px" }}>
                Select Your Company (3 Available):
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedProf.companies.map((comp, idx) => {
                  const isCompSelected = idx === selectedCompanyIdx;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedCompanyIdx(idx)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: isCompSelected ? "rgba(16, 185, 129, 0.18)" : "rgba(30, 41, 59, 0.5)",
                        border: isCompSelected ? "1.5px solid #10b981" : "1px solid rgba(255, 255, 255, 0.08)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: isCompSelected ? "#34d399" : "#fff" }}>
                          🏢 {comp.name}
                        </div>
                        <div style={{ color: "#4ade80", fontWeight: 700, fontSize: "12px" }}>
                          ${comp.salaryPerShift}/shift
                        </div>
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                        📍 {comp.address} · {comp.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Uniform preview badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                background: "rgba(30, 41, 59, 0.4)",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Uniform Scheme:</div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: selectedProf.uniform.jacketColor,
                    border: "1px solid #fff",
                  }}
                  title="Jacket"
                />
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: selectedProf.uniform.pantsColor,
                    border: "1px solid #fff",
                  }}
                  title="Pants"
                />
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: selectedProf.uniform.sneakerColor,
                    border: "1px solid #fff",
                  }}
                  title="Kicks"
                />
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={!net.room}
              style={{
                marginTop: "auto",
                background: "linear-gradient(135deg, #0284c7, #2563eb)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "15px",
                fontWeight: 800,
                letterSpacing: "0.5px",
                cursor: net.room ? "pointer" : "not-allowed",
                opacity: net.room ? 1 : 0.65,
                boxShadow: "0 4px 18px rgba(2, 132, 199, 0.4)",
                transition: "transform 0.1s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {net.room ? "CONFIRM CAREER & ENTER CHICAGO 🚀" : "CONNECTING TO CHICAGO…"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
