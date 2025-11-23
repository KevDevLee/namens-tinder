"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { getProfileIdByRole } from "../utils/getProfileIdByRole";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const { user, role, loading, allowed } = useRoleGuard();

  useEffect(() => {
    async function loadMatches() {
      if (!user?.id) return;

      setLoadingMatches(true);

      try {
        const otherRole = role === "papa" ? "mama" : "papa";
        const otherUserId = await getProfileIdByRole(otherRole);

        const [{ data: myDecisions }, { data: otherDecisions }] =
          await Promise.all([
            supabase
              .from("decisions")
              .select("name_id")
              .eq("user_id", user.id)
              .eq("decision", "like"),
            otherUserId
              ? supabase
                  .from("decisions")
                  .select("name_id")
                  .eq("user_id", otherUserId)
                  .eq("decision", "like")
              : Promise.resolve({ data: [] }),
          ]);

        const myLikes = new Set((myDecisions || []).map((row) => row.name_id));
        const shared = (otherDecisions || [])
          .map((row) => row.name_id)
          .filter((id) => myLikes.has(id));

        if (shared.length === 0) {
          setMatches([]);
          setLoadingMatches(false);
          return;
        }

        const { data: names } = await supabase
          .from("names")
          .select("*")
          .in("id", shared)
          .order("name");

        setMatches(names || []);
      } catch (err) {
        console.error("loadMatches error:", err);
        setMatches([]);
      } finally {
        setLoadingMatches(false);
      }
    }

    loadMatches();
  }, [user?.id, role]);

  if (loading || !allowed) {
    return <AppBackground>Loading…</AppBackground>;
  }

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

        {loadingMatches ? (
          <p
            style={{
              color: "#1663a6",
              fontSize: 18,
              textAlign: "center",
              marginTop: 40,
              opacity: 0.8,
            }}
          >
            Lade Matches…
          </p>
        ) : matches.length === 0 ? (
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
