"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";
import { useRoleGuard } from "../hooks/useRoleGuard";

export default function StatsDetailsPage() {
  const [activeUser, setActiveUser] = useState("papa"); // Tabs
  const [activeType, setActiveType] = useState("like");
  const [data, setData] = useState({
    papa: { like: [], nope: [], maybe: [] },
    mama: { like: [], nope: [], maybe: [] },
  });
  const { user, loading, allowed } = useRoleGuard();

  // ---------------------------------------------------
  // Daten laden
  // ---------------------------------------------------
  useEffect(() => {
    if (loading || !allowed) return;

    async function load() {
      async function fetchAllDecisions() {
        const pageSize = 1000;
        let all = [];
        let from = 0;

        while (true) {
          const { data, error } = await supabase
            .from("decisions")
            .select("id, user_id, decision, name_id, names(name, gender)")
            .order("id")
            .range(from, from + pageSize - 1);

          if (error) {
            console.error("load decisions error:", error);
            break;
          }

          if (!data || data.length === 0) break;

          all = all.concat(data);

          if (data.length < pageSize) break;

          from += pageSize;
        }

        return all;
      }

      const [{ data: profileRows }, rows] = await Promise.all([
        supabase.from("profiles").select("id, role"),
        fetchAllDecisions(),
      ]);

      if (!rows || !profileRows) return;

      const structured = {
        papa: { like: [], nope: [], maybe: [] },
        mama: { like: [], nope: [], maybe: [] },
      };

      const roleMap = profileRows.reduce((acc, row) => {
        acc[row.id] = (row.role || "").toLowerCase();
        return acc;
      }, {});

      const latestPerUserName = new Map();
      rows.forEach((row) => {
        const key = `${row.user_id}-${row.name_id}`;
        const existing = latestPerUserName.get(key);
        if (!existing || row.id > existing.id) {
          latestPerUserName.set(key, row);
        }
      });

      latestPerUserName.forEach((r) => {
        const role = roleMap[r.user_id];
        if (!role || !structured[role]) return;

        const normalizedGender = (r.names?.gender || "").toLowerCase();
        structured[role][r.decision].push({
          id: r.id,
          user_id: r.user_id,
          name_id: r.name_id,
          name: r.names?.name || "",
          gender:
            normalizedGender === "m" || normalizedGender === "w"
              ? normalizedGender
              : normalizedGender || null,
        });
      });

      Object.keys(structured).forEach((role) => {
        ["like", "maybe", "nope"].forEach((cat) => {
          structured[role][cat].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
          );
        });
      });

      setData(structured);

      console.log(rows);
    }

    load();
  }, [loading, allowed]);

  // ---------------------------------------------------
  // Löschen → Name wieder in Stapel
  // ---------------------------------------------------
  async function removeDecision(idToDelete) {
    if (!user?.id) return;

    await supabase
      .from("decisions")
      .delete()
      .eq("id", idToDelete)
      .eq("user_id", user.id);

    setData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));

      ["papa", "mama"].forEach((role) => {
        ["like", "nope", "maybe"].forEach((cat) => {
          copy[role][cat] = copy[role][cat].filter(
            (item) => item.id !== idToDelete
          );
        });
      });

      return copy;
    });
  }

  if (loading || !allowed) {
    return <AppBackground>Loading…</AppBackground>;
  }

  const userLabel = activeUser === "papa" ? "Papa" : "Mama";
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
            active={activeUser === "papa"}
            label="Papa"
            onClick={() => setActiveUser("papa")}
          />

          <TabButton
            active={activeUser === "mama"}
            label="Mama"
            onClick={() => setActiveUser("mama")}
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
          .map((item) => {
            const ownEntry = item.user_id === user?.id;
            return (
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
                <span style={{ color: "#1663a6", fontWeight: 600 }}>
                  {item.name}
                </span>
                {ownEntry && (
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
                )}
              </div>
            );
          })}
      </div>

      {/* Rechte Spalte – Mädchennamen */}
      <div>
        <h3 style={{ color: "#1663a6", marginBottom: 8 }}>
          👧 Mädchen
        </h3>
        {items
          .filter((item) => item.gender === "w")
          .map((item) => {
            const ownEntry = item.user_id === user?.id;
            return (
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
                <span style={{ color: "#1663a6", fontWeight: 600 }}>
                  {item.name}
                </span>
                {ownEntry && (
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
                )}
              </div>
            );
          })}
      </div>
      {items.some((item) => item.gender !== "m" && item.gender !== "w") && (
        <div style={{ gridColumn: "1 / span 2" }}>
          <h3 style={{ color: "#1663a6", marginBottom: 8 }}>
            ✨ Ohne Zuordnung
          </h3>
          {items
            .filter((item) => item.gender !== "m" && item.gender !== "w")
            .map((item) => {
              const ownEntry = item.user_id === user?.id;
              return (
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
                  <span style={{ color: "#1663a6", fontWeight: 600 }}>
                    {item.name}
                  </span>
                  {ownEntry && (
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
                  )}
                </div>
              );
            })}
        </div>
      )}
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
