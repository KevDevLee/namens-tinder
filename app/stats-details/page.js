"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";

export default function StatsDetailsPage() {
  const [activeUser, setActiveUser] = useState("me");     // Papa/Mama Tab
  const [activeType, setActiveType] = useState("like");   // like/maybe/nope Tab

  const [data, setData] = useState({
    me: { like: [], nope: [], maybe: [] },
    her: { like: [], nope: [], maybe: [] }
  });

  // ---------------------------------------------------
  // Daten laden
  // ---------------------------------------------------
  useEffect(() => {
    async function load() {
      const { data: rows } = await supabase
        .from("decisions")
        .select("id, user, decision, name_id, names(name, gender)")
        .order("id");

      if (!rows) return;

      const structured = {
  me: { like: [], nope: [], maybe: [] },
  her: { like: [], nope: [], maybe: [] }
};

rows.forEach(r => {
  const group = r.user;
  const type = r.decision;

  structured[group][type].push({
    id: r.id,
    name_id: r.name_id,
    name: r.names?.name || "",
    gender: r.names?.gender || null
  });
});


      setData(structured);
    }

    load();
  }, []);

  // ---------------------------------------------------
  // Löschen → Name wieder in Stapel
  // ---------------------------------------------------
  async function removeDecision(idToDelete) {
    await supabase.from("decisions").delete().eq("id", idToDelete);

    setData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));

      ["me", "her"].forEach(user => {
        ["like", "nope", "maybe"].forEach(cat => {
          copy[user][cat] = copy[user][cat].filter(item => item.id !== idToDelete);
        });
      });

      return copy;
    });
  }

  const userLabel = activeUser === "me" ? "Papa" : "Mama";
  const items = data[activeUser][activeType];

  return (
    <AppBackground>
      <AppCard style={{ paddingBottom: 40, position: "relative" }}>
        <BackButton />

        <h1
          style={{
            color: "#1663a6",
            fontSize: 28,
            marginBottom: 20,
            marginTop: 6
          }}
        >
          Statistik-Details
        </h1>

        {/* USER TABS */}
        <div
          style={{
            display: "flex",
            marginBottom: 16,
            gap: 6,
            width: "100%"
          }}
        >
          <TabButton
            active={activeUser === "me"}
            label="Papa"
            onClick={() => setActiveUser("me")}
          />

          <TabButton
            active={activeUser === "her"}
            label="Mama"
            onClick={() => setActiveUser("her")}
          />
        </div>

        {/* DECISION TABS */}
        <div
          style={{
            display: "flex",
            marginBottom: 16,
            gap: 6,
            width: "100%"
          }}
        >
          <TabButton
            active={activeType === "like"}
            label="Likes"
            onClick={() => setActiveType("like")}
          />
          <TabButton
            active={activeType === "maybe"}
            label="Vielleicht"
            onClick={() => setActiveType("maybe")}
          />
          <TabButton
            active={activeType === "nope"}
            label="Nopes"
            onClick={() => setActiveType("nope")}
          />
        </div>

{/* SCROLLABLE TWO-COLUMN LIST */}
<div
  style={{
    maxHeight: "380px",
    overflowY: "auto",
    paddingRight: 6,
  }}
>
  {items.length === 0 ? (
    <p style={{ color: "#777", fontSize: 14 }}>Keine Einträge.</p>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
      }}
    >
      {/* Linke Spalte – Jungennamen */}
      <div>
        <h3 style={{ color: "#1663a6", marginBottom: 8 }}>
          👦 Jungen
        </h3>
        {items
          .filter((item) => item.gender === "m")
          .map((item) => (
            <div
              key={item.id}
              style={{
                background: "#ffffff",
                borderRadius: 8,
                padding: "8px 10px",
                marginBottom: 8,
                boxShadow: "0 4px 10px rgba(0,0,0,0.10)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ color: "#1663a6", fontWeight: 600 }}
              >
                {item.name}
              </span>
              <button
                onClick={() => removeDecision(item.id)}
                style={{
                  background: "#ff4d4d",
                  border: "none",
                  padding: "6px 10px",
                  color: "white",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                X
              </button>
            </div>
          ))}
      </div>

      {/* Rechte Spalte – Mädchennamen */}
      <div>
        <h3 style={{ color: "#1663a6", marginBottom: 8 }}>
          👧 Mädchen
        </h3>
        {items
          .filter((item) => item.gender === "w")
          .map((item) => (
            <div
              key={item.id}
              style={{
                background: "#ffffff",
                borderRadius: 8,
                padding: "8px 10px",
                marginBottom: 8,
                boxShadow: "0 4px 10px rgba(0,0,0,0.10)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ color: "#1663a6", fontWeight: 600 }}
              >
                {item.name}
              </span>
              <button
                onClick={() => removeDecision(item.id)}
                style={{
                  background: "#ff4d4d",
                  border: "none",
                  padding: "6px 10px",
                  color: "white",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                X
              </button>
            </div>
          ))}
      </div>
    </div>
  )}
</div>

      </AppCard>
    </AppBackground>
  );
}



function TabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 12px",
        border: "none",
        borderRadius: 10,
        background: active ? "#4a90e2" : "#dbe9ff",
        color: active ? "white" : "#1663a6",
        fontSize: 16,
        fontWeight: 600
      }}
    >
      {label}
    </button>
  );
}
