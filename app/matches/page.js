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
  const [maybeMatches, setMaybeMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const { user, role, loading, allowed } = useRoleGuard();

  useEffect(() => {
    async function loadMatches() {
      if (!user?.id) return;

      setLoadingMatches(true);

      try {
        const otherRole = role === "papa" ? "mama" : "papa";
        const otherUserId = await getProfileIdByRole(otherRole);

        const fetchDecisions = (userId) =>
          userId
            ? supabase
                .from("decisions")
                .select("id, name_id, decision")
                .eq("user_id", userId)
                .order("id", { ascending: false })
            : Promise.resolve({ data: [] });

        const [{ data: myRows }, { data: otherRows }] = await Promise.all([
          fetchDecisions(user.id),
          fetchDecisions(otherUserId),
        ]);

        const latestByName = (rows) => {
          const map = new Map();
          (rows || []).forEach((row) => {
            if (!map.has(row.name_id)) {
              map.set(row.name_id, row.decision);
            }
          });
          return map;
        };

        const myLatest = latestByName(myRows);
        const otherLatest = latestByName(otherRows);

        const allNameIds = new Set([
          ...myLatest.keys(),
          ...otherLatest.keys(),
        ]);

        const confirmedMatches = [];
        const maybeCandidates = [];

        allNameIds.forEach((nameId) => {
          const myDecision = myLatest.get(nameId);
          const otherDecision = otherLatest.get(nameId);

          if (myDecision === "like" && otherDecision === "like") {
            confirmedMatches.push(nameId);
          } else if (
            (myDecision === "like" && otherDecision === "maybe") ||
            (myDecision === "maybe" && otherDecision === "like") ||
            (myDecision === "maybe" && otherDecision === "maybe")
          ) {
            maybeCandidates.push(nameId);
          }
        });

        const combinedIds = [...new Set([...confirmedMatches, ...maybeCandidates])];

        if (combinedIds.length === 0) {
          setMatches([]);
          setMaybeMatches([]);
          setLoadingMatches(false);
          return;
        }

        const { data: names } = await supabase
          .from("names")
          .select("*")
          .in("id", combinedIds)
          .order("name");

        const nameMap = new Map((names || []).map((n) => [n.id, n]));

        setMatches(
          confirmedMatches
            .map((id) => nameMap.get(id))
            .filter(Boolean)
        );
        setMaybeMatches(
          maybeCandidates
            .map((id) => nameMap.get(id))
            .filter(Boolean)
        );
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
        ) : matches.length === 0 && maybeMatches.length === 0 ? (
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
          <>
            {matches.length > 0 && (
              <>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#1663a6",
                    marginTop: 10,
                    textAlign: "center",
                  }}
                >
                  Gemeinsame Likes
                </h2>
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
              </>
            )}

            {maybeMatches.length > 0 && (
              <>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#1663a6",
                    marginTop: 20,
                    textAlign: "center",
                  }}
                >
                  Offene Favoriten
                </h2>
                <p
                  style={{
                    color: "#4a4a4a",
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  Einer hat „Like“ und der andere „Maybe“ – oder beide „Maybe“.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    gap: 12,
                  }}
                >
                  {maybeMatches.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        background: "linear-gradient(120deg, #fff5e5 0%, #ffe7c7 100%)",
                        padding: "14px 18px",
                        borderRadius: 14,
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#7a5200",
                        boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
                        textAlign: "center",
                      }}
                    >
                      {m.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </AppCard>
    </AppBackground>
  );
}
