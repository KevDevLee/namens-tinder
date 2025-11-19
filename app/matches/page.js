"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    async function loadMatches() {
      // Likes beider Nutzer laden
      const { data: likes } = await supabase.from("likes").select("*");

      if (!likes) return;

      const myLikes = likes
        .filter((l) => l.user === "me")
        .map((l) => l.name_id);

      const herLikes = likes
        .filter((l) => l.user === "her")
        .map((l) => l.name_id);

      // Schnittmenge bilden
      const matchedIds = myLikes.filter((id) => herLikes.includes(id));

      if (matchedIds.length === 0) {
        setMatches([]);
        return;
      }

      // Namen zu IDs laden
      const { data: names } = await supabase
        .from("names")
        .select("*")
        .in("id", matchedIds)
        .order("name");

      setMatches(names || []);
    }

    loadMatches();
  }, []);

  return (
    <AppBackground>
      <AppCard style={{ position: "relative", paddingBottom: 40 }}>

        <BackButton />

        <h1
          style={{
            color: "#1663a6",
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 20,
            marginTop: 6,
            textAlign: "center",
          }}
        >
          Matches
        </h1>

        {matches.length === 0 ? (
          <p
            style={{
              color: "#1663a6",
              fontSize: 18,
              textAlign: "center",
              marginTop: 40,
              opacity: 0.8,
            }}
          >
            Noch keine gemeinsamen Likes.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 12,
              marginTop: 10,
            }}
          >
            {matches.map((m) => (
              <div
                key={m.id}
                style={{
                  background: "linear-gradient(120deg, #e8f3ff 0%, #ffffff 100%)",
                  padding: "14px 18px",
                  borderRadius: 14,
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1663a6",
                  boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
                  textAlign: "center",
                }}
              >
                {m.name}
              </div>
            ))}
          </div>
        )}
      </AppCard>
    </AppBackground>
  );
}
