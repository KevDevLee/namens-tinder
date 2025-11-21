"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";

// -------------------------------------------------------
// SCROLLBARE NAME LIST
// -------------------------------------------------------
function NameList({ title, items, onRemove }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{ color: "#1663a6", marginBottom: 10 }}>{title}</h3>

      {items.length === 0 ? (
        <p style={{ color: "#777", fontSize: 14 }}>Keine Einträge</p>
      ) : (
        <div
          style={{
            maxHeight: 300,
            overflowY: "auto",
            paddingRight: 6,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                background: "white",
                borderRadius: 12,
                padding: "10px 14px",
                boxShadow: "0 6px 12px rgba(0,0,0,0.12)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: 16, color: "#1663a6", fontWeight: 600 }}
              >
                {item.name}
              </span>

              <button
                onClick={() => onRemove(item.id)}
                style={{
                  background: "#ff4d4d",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------
// TAB BUTTON
// -------------------------------------------------------
function TabButton({ id, active, label, setActiveTab }) {
  return (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1,
        padding: "10px 12px",
        border: "none",
        borderRadius: 10,
        background: active ? "#4a90e2" : "#dbe9ff",
        color: active ? "white" : "#1663a6",
        fontSize: 16,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}

// -------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------
export default function StatsDetailsPage() {
  const [activeTab, setActiveTab] = useState("me"); // "me" oder "her"
  const [data, setData] = useState({
    me: { like: [], nope: [], maybe: [] },
    her: { like: [], nope: [], maybe: [] },
  });

  // ---------------------------------------------------
  // Daten laden
  // ---------------------------------------------------
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: rows } = await supabase
      .from("decisions")
      .select("id, user, decision, name_id, names(name)")
      .order("id");

    if (!rows) return;

    const structured = {
      me: { like: [], nope: [], maybe: [] },
      her: { like: [], nope: [], maybe: [] },
    };

    rows.forEach((r) => {
      structured[r.user][r.decision].push({
        id: r.id,
        name_id: r.name_id,
        name: r.names?.name || "",
      });
    });

    setData(structured);
  }

  // ---------------------------------------------------
  // Entscheidung löschen → Name zurück ins Deck
  // ---------------------------------------------------
  async function removeDecision(entryId) {
    await supabase.from("decisions").delete().eq("id", entryId);

    // UI aktualisieren
    setData((prev) => {
      const copy = structuredClone(prev);

      ["me", "her"].forEach((u) => {
        ["like", "nope", "maybe"].forEach((c) => {
          copy[u][c] = copy[u][c].filter((i) => i.id !== entryId);
        });
      });

      return copy;
    });
  }

  const tabData = data[activeTab];

  return (
    <AppBackground>
      <AppCard style={{ paddingBottom: 40, position: "relative" }}>
        
        {/* BackButton korrekt auf der Karte */}
        <BackButton />

        <h1
          style={{
            color: "#1663a6",
            fontSize: 28,
            marginBottom: 16,
            marginTop: 6,
          }}
        >
          Statistik-Details
        </h1>

        {/* TABS */}
        <div
          style={{
            display: "flex",
            marginBottom: 24,
            gap: 6,
            width: "100%",
          }}
        >
          <TabButton
            id="me"
            label="Papa"
            active={activeTab === "me"}
            setActiveTab={setActiveTab}
          />
          <TabButton
            id="her"
            label="Mama"
            active={activeTab === "her"}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* LISTEN (scrollable) */}
        <NameList
          title="Likes"
          items={tabData.like}
          onRemove={removeDecision}
        />
        <NameList
          title="Nopes"
          items={tabData.nope}
          onRemove={removeDecision}
        />
        <NameList
          title="Vielleicht"
          items={tabData.maybe}
          onRemove={removeDecision}
        />
      </AppCard>
    </AppBackground>
  );
}
