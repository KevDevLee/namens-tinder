"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";
import { useRoleGuard } from "../hooks/useRoleGuard";

const tabs = [
  { key: "like", label: "Likes" },
  { key: "maybe", label: "Maybe" },
  { key: "nope", label: "Nopes" },
];

export default function MyDecisionsPage() {
  const { user, loading, allowed } = useRoleGuard();
  const [entries, setEntries] = useState({
    like: [],
    maybe: [],
    nope: [],
  });
  const [busy, setBusy] = useState(true);
  const [activeTab, setActiveTab] = useState("like");

  useEffect(() => {
    if (loading || !allowed || !user?.id) return;

    async function load() {
      setBusy(true);
      const { data, error } = await supabase
        .from("decisions")
        .select("id, name_id, decision, names(name, gender)")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (!error && data) {
        const latestByName = new Map();
        data.forEach((row) => {
          if (!latestByName.has(row.name_id)) {
            latestByName.set(row.name_id, row);
          }
        });

        const grouped = { like: [], maybe: [], nope: [] };
        latestByName.forEach((row) => {
          const decision = row.decision;
          if (!grouped[decision]) grouped[decision] = [];
          grouped[decision].push({
            id: row.id,
            name: row.names?.name || "Unbekannt",
            gender: row.names?.gender || null,
          });
        });

        Object.keys(grouped).forEach((key) => {
          grouped[key].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
          );
        });

        setEntries(grouped);
      }

      setBusy(false);
    }

    load();
  }, [loading, allowed, user?.id]);

  if (loading || !allowed || busy) {
    return <AppBackground>Loading…</AppBackground>;
  }

  const list = entries[activeTab] || [];

  async function removeDecision(idToDelete) {
    if (!user?.id) return;

    await supabase
      .from("decisions")
      .delete()
      .eq("id", idToDelete)
      .eq("user_id", user.id);

    setEntries((prev) => {
      const copy = structuredClone(prev);
      ["like", "maybe", "nope"].forEach((type) => {
        copy[type] = copy[type].filter((item) => item.id !== idToDelete);
      });
      return copy;
    });
  }

  return (
    <AppBackground>
      <AppCard
        style={{
          gap: 18,
          paddingBottom: 32,
          width: "100%",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        <BackButton />
        <h1
          style={{
            fontSize: 26,
            color: "#1663a6",
            fontWeight: 800,
            marginBottom: 4,
          }}
        >
          Meine Entscheidungen
        </h1>
        <p style={{ color: "#4a4a4a", marginBottom: 8 }}>
          Hier findest du alle Namen, die du bereits bewertet hast.
        </p>

        <div
          style={{
            display: "flex",
            marginBottom: 4,
            gap: 6,
            width: "100%",
          }}
        >
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              active={activeTab === tab.key}
              label={`${tab.label} (${entries[tab.key]?.length || 0})`}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </div>

        <div
          style={{
            width: "100%",
            flex: 1,
            overflowY: "auto",
            paddingRight: 6,
          }}
        >
          {list.length === 0 ? (
            <p style={{ color: "#777", fontSize: 14 }}>Keine Einträge.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <GenderList
                title="Jungen"
                items={list.filter((i) => i.gender === "m")}
                onRemove={removeDecision}
              />
              <GenderList
                title="Mädchen"
                items={list.filter((i) => i.gender === "w")}
                onRemove={removeDecision}
              />

              {list.some((i) => i.gender !== "m" && i.gender !== "w") && (
                <div style={{ gridColumn: "1 / span 2" }}>
                  <GenderList
                    title="✨ Ohne Zuordnung"
                    items={list.filter((i) => i.gender !== "m" && i.gender !== "w")}
                    onRemove={removeDecision}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </AppCard>
    </AppBackground>
  );
}

function GenderList({ title, items, onRemove }) {
  return (
    <div>
      <h3 style={{ color: "#1663a6", marginBottom: 8 }}>{title}</h3>
      {items.length === 0 ? (
        <p style={{ color: "#999", fontSize: 13 }}>Keine Einträge</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#ffffff",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 8,
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#1663a6",
              fontWeight: 600,
              gap: 12,
            }}
          >
            <span>{item.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* {item.gender && (
                <span style={{ opacity: 0.7 }}>
                  {item.gender === "m" ? "👦" : item.gender === "w" ? "👧" : "✨"}
                </span>
              )} */}
              <button
                onClick={() => onRemove?.(item.id)}
                style={{
                  background: "#ff4d4d",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: 6,
                  color: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                X
              </button>
            </div>
          </div>
        ))
      )}
    </div>
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
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
