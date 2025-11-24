"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";
import { useRoleGuard } from "../hooks/useRoleGuard";

const sections = [
  { key: "like", label: "❤️ Likes", color: "#1663a6" },
  { key: "maybe", label: "🤔 Vielleicht", color: "#f0a500" },
  { key: "nope", label: "🙅‍♂️ Nopes", color: "#d7263d" },
];

export default function MyDecisionsPage() {
  const { user, loading, allowed } = useRoleGuard();
  const [entries, setEntries] = useState({
    like: [],
    maybe: [],
    nope: [],
  });
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading || !allowed || !user?.id) return;

    async function load() {
      setBusy(true);
      const { data, error } = await supabase
        .from("decisions")
        .select("id, decision, names(name, gender)")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (!error && data) {
        const grouped = { like: [], maybe: [], nope: [] };
        data.forEach((row) => {
          const decision = row.decision;
          if (!grouped[decision]) grouped[decision] = [];
          grouped[decision].push({
            id: row.id,
            name: row.names?.name || "Unbekannt",
            gender: row.names?.gender || null,
          });
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

  return (
    <AppBackground>
      <AppCard style={{ gap: 20, paddingBottom: 32, width: "100%" }}>
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
        <p style={{ color: "#4a4a4a", marginBottom: 12 }}>
          Hier findest du alle Namen, die du bereits bewertet hast.
        </p>

        {sections.map((section) => {
          const items = entries[section.key] || [];
          return (
            <div
              key={section.key}
              style={{
                width: "100%",
                textAlign: "left",
                background: "#f6fbff",
                padding: "12px 16px",
                borderRadius: 14,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <h3
                style={{
                  color: section.color,
                  fontSize: 18,
                  marginBottom: 10,
                }}
              >
                {section.label} ({items.length})
              </h3>

              {items.length === 0 ? (
                <p style={{ color: "#777", fontSize: 14 }}>Keine Einträge.</p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {items.map((item) => (
                    <li
                      key={item.id}
                      style={{
                        background: "white",
                        padding: "10px 12px",
                        borderRadius: 10,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#1663a6",
                        fontWeight: 600,
                      }}
                    >
                      <span>{item.name}</span>
                      {item.gender && (
                        <span style={{ fontSize: 14, opacity: 0.7 }}>
                          {item.gender === "m" ? "👦" : "👧"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </AppCard>
    </AppBackground>
  );
}
