"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";
import AppButton from "../components/AppButton";
import Link from "next/link";

export default function NameManagerPage() {
  const [names, setNames] = useState([]);
  const [letter, setLetter] = useState("ALL");

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Names from DB
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("names")
        .select("*")
        .order("name", { ascending: true });

      if (data) setNames(data);
    }
    load();
  }, []);

  // Filtered names
  const filteredNames = names.filter((n) => {
    if (letter === "ALL") return true;
    return n.name.toUpperCase().startsWith(letter);
  });

  return (
    <AppBackground>
      <AppCard style={{ paddingBottom: 40 }}>
        <BackButton />

        <h1
          style={{
            color: "#1663a6",
            fontSize: 28,
            marginBottom: 12,
            marginTop: 6,
            textAlign: "center",
            fontWeight: 800,
          }}
        >
          Namensmanager
        </h1>

        {/* Alphabet Filter */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          {letters.map((l) => (
            <button
              key={l}
              onClick={() => setLetter(l)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "none",
                fontWeight: 600,
                background: letter === l ? "#4a90e2" : "#e3efff",
                color: letter === l ? "white" : "#1663a6",
                minWidth: 36,
                fontSize: 15,
              }}
            >
              {l}
            </button>
          ))}

          {/* ALL Button */}
          <button
            onClick={() => setLetter("ALL")}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "none",
              fontWeight: 600,
              background: letter === "ALL" ? "#4a90e2" : "#e3efff",
              color: letter === "ALL" ? "white" : "#1663a6",
              fontSize: 15,
            }}
          >
            Alle
          </button>
        </div>

{/* Name List */}
<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 4,
    maxHeight: "60vh",
    overflowY: "auto",
    paddingRight: 4,
  }}
>
  {filteredNames.length === 0 && (
    <p style={{ color: "#1663a6", textAlign: "center", opacity: 0.7 }}>
      Keine Namen gefunden.
    </p>
  )}

  {filteredNames.map((n) => (
    <div
      key={n.id}
      style={{
        background: "white",
        color: "#1663a6",
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid #dce7f7",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 15,
      }}
    >
      <span style={{ fontWeight: 600 }}>{n.name}</span>
    </div>
  ))}
</div>


        {/* Add Name */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <AppButton href="/add-name" style={{ background: "#4a90e2" }}>
            Neuen Namen hinzufügen
          </AppButton>
        </div>
      </AppCard>
    </AppBackground>
  );
}
