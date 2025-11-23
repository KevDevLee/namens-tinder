"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import AppBackground from "../components/AppBackground";
import { fetchAllNames } from "../utils/fetchAllNames"; 
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";
import AppButton from "../components/AppButton";
import Link from "next/link";

export default function NameManagerPage() {
  const [names, setNames] = useState([]);
  const [letter, setLetter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" | "desc"

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // ----------------------------------------
  // LOAD NAMES
  // ----------------------------------------
useEffect(() => {
  async function load() {
    const all = await fetchAllNames("all");
    setNames(all);
  }

  load();

  const reload = localStorage.getItem("reload-names");
  if (reload) {
    load().then(() => localStorage.removeItem("reload-names"));
  }
}, []);

  // ----------------------------------------
  // FILTER + SEARCH + SORT
  // ----------------------------------------
  const filteredNames = names
    .filter((n) => {
      if (letter !== "ALL" && !n.name.toUpperCase().startsWith(letter))
        return false;
      if (search.trim() !== "" && !n.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  return (
    <AppBackground>
      <AppCard style={{ paddingBottom: 40 }}>
        <BackButton />

        <h1
          style={{
            color: "#1663a6",
            fontSize: 28,
            marginBottom: 16,
            marginTop: 6,
            textAlign: "center",
            fontWeight: 800,
          }}
        >
          Namensmanager
        </h1>

        {/* SEARCH FIELD */}
        <div style={{ marginBottom: 18, textAlign: "center" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Namen suchen…"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #aac7e8",
              fontSize: 16,
              outline: "none",
            }}
          />
        </div>

        {/* SORT BUTTON */}
        <div style={{ textAlign: "right", marginBottom: 10 }}>
          <button
            onClick={() =>
              setSortOrder(sortOrder === "asc" ? "desc" : "asc")
            }
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "none",
              background: "#e3efff",
              color: "#1663a6",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {sortOrder === "asc" ? "↓ A–Z" : "↑ Z–A"}
          </button>
        </div>

        {/* LETTER FILTER */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            justifyContent: "center",
            marginBottom: 16,
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

        {/* NAME LIST (scrollable) */}
        <div
          style={{
            maxHeight: "55vh",
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {filteredNames.length === 0 ? (
            <p
              style={{
                color: "#1663a6",
                textAlign: "center",
                opacity: 0.7,
                marginTop: 20,
              }}
            >
              Keine Namen gefunden.
            </p>
          ) : (
            filteredNames.map((n) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "white",
                  padding: "10px 12px",
                  marginBottom: 6,
                  borderRadius: 8,
                  border: "1px solid #dce7f7",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                {/* Name */}
                <span style={{ fontSize: 16, fontWeight: 600, color: "#1663a6" }}>
                  {n.name}
                </span>

                {/* Gender Badge */}
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "white",
                    background:
                      n.gender === "m" ? "#4a90e2" : n.gender === "w" ? "#ff8dcf" : "#aaa",
                  }}
                >
                  {n.gender === "m" ? "J" : n.gender === "w" ? "M" : "?"}
                </span>
              </div>
            ))
          )}
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
