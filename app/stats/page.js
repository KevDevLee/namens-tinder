"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import AppButton from "../components/AppButton";
import BackButton from "../components/BackButton";

export default function StatsPage() {
  const [meLikes, setMeLikes] = useState([]);
  const [herLikes, setHerLikes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // Daten laden
  // --------------------------------------------------
  useEffect(() => {
    async function loadStats() {
      setLoading(true);

      // Alle Namen
      const { data: namesData } = await supabase
        .from("names")
        .select("*");

      // Likes Papa
      const { data: meLikeRows } = await supabase
        .from("likes")
        .select("name_id")
        .eq("user", "me");

      // Likes Mama
      const { data: herLikeRows } = await supabase
        .from("likes")
        .select("name_id")
        .eq("user", "her");

      const meLikedIds = new Set(meLikeRows?.map(r => r.name_id) || []);
      const herLikedIds = new Set(herLikeRows?.map(r => r.name_id) || []);

      const idToName = {};
      namesData?.forEach(n => { idToName[n.id] = n.name });

      const meList = [...meLikedIds].map(id => idToName[id]).filter(Boolean);
      const herList = [...herLikedIds].map(id => idToName[id]).filter(Boolean);
      const matchedIds = [...meLikedIds].filter(id => herLikedIds.has(id));
      const matchNames = matchedIds.map(id => idToName[id]).filter(Boolean);

      setMeLikes(meList);
      setHerLikes(herList);
      setMatches(matchNames);
      setLoading(false);
    }

    loadStats();
  }, []);

  // --------------------------------------------------
  // CSV Export
  // --------------------------------------------------
  function exportCSV() {
    const rows = [
      ["Kategorie", "Name"],
      ...meLikes.map(n => ["Papa Like", n]),
      ...herLikes.map(n => ["Mama Like", n]),
      ...matches.map(n => ["Match", n]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map(e => e.join(";")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = "babynamen_stats.csv";
    link.click();
  }

  // --------------------------------------------------
  // Alles löschen
  // --------------------------------------------------
  async function resetAll() {
    const ok = confirm("Willst du WIRKLICH alle Likes löschen?");
    if (!ok) return;

    await supabase.from("likes").delete().neq("id", 0);
    location.reload();
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  if (loading) return <AppBackground>Loading…</AppBackground>;

  return (
    <AppBackground>
      <AppCard style={{ position: "relative", paddingBottom: 40 }}>
        
        {/* BACK BUTTON HIER */}
        <BackButton />

        <h1
          style={{
            color: "#1663a6",
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 20,
            marginTop: 6,
            textAlign: "center"
          }}
        >
          📊 Statistik
        </h1>

        {/* Matches */}
        <section style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1663a6" }}>
            💞 Matches ({matches.length})
          </h2>
          {matches.length === 0 ? (
            <p style={{ color: "#666" }}>Noch keine Übereinstimmungen.</p>
          ) : (
            <ul style={{ marginTop: 8 }}>
              {matches.map((name, i) => (
                <li key={i} style={{ fontSize: 16, padding: "4px 0" }}>
                  {name}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Papas Likes */}
        <section style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1663a6" }}>
            👨 Papas Likes ({meLikes.length})
          </h2>
          {meLikes.length === 0 ? (
            <p style={{ color: "#666" }}>Noch keine Likes.</p>
          ) : (
            <ul style={{ marginTop: 8 }}>
              {meLikes.map((name, i) => (
                <li key={i} style={{ fontSize: 16, padding: "4px 0" }}>
                  {name}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Mamas Likes */}
        <section style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1663a6" }}>
            👩 Mamas Likes ({herLikes.length})
          </h2>
          {herLikes.length === 0 ? (
            <p style={{ color: "#666" }}>Noch keine Likes.</p>
          ) : (
            <ul style={{ marginTop: 8 }}>
              {herLikes.map((name, i) => (
                <li key={i} style={{ fontSize: 16, padding: "4px 0" }}>
                  {name}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ACTION BUTTONS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 30,
          }}
        >
          <AppButton onClick={exportCSV}>
            📥 CSV Exportieren
          </AppButton>

          <AppButton
            onClick={resetAll}
            style={{ background: "#ff4d4d" }}
          >
            ❌ Alles löschen
          </AppButton>
        </div>
      </AppCard>
    </AppBackground>
  );
}
