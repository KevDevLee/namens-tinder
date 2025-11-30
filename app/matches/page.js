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
  const [showMaybes, setShowMaybes] = useState(false);
  const [activeName, setActiveName] = useState(null);
  const { user, role, loading, allowed } = useRoleGuard();

  useEffect(() => {
    async function loadMatches() {
      if (!user?.id) return;

      setLoadingMatches(true);

      try {
        const otherRole = role === "papa" ? "mama" : "papa";
        const otherUserId = await getProfileIdByRole(otherRole);

        const fetchDecisions = async (userId) => {
          if (!userId) return [];

          const pageSize = 1000;
          let all = [];
          let from = 0;

          while (true) {
            const { data, error } = await supabase
              .from("decisions")
              .select("id, name_id, decision")
              .eq("user_id", userId)
              .order("id", { ascending: false })
              .range(from, from + pageSize - 1);

            if (error) {
              console.error("matches fetch decisions error:", error);
              break;
            }

            if (!data || data.length === 0) break;

            all = all.concat(data);

            if (data.length < pageSize) break;

            from += pageSize;
          }

          return all;
        };

        const [myRows, otherRows] = await Promise.all([
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
                  Gemeinsame Likes ({matches.length})
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
                    <MatchNameCard key={m.id} name={m} onClick={() => setActiveName(m)} />
                  ))}
                </div>
              </>
            )}

            {maybeMatches.length > 0 && (
              <div
                style={{
                  marginTop: 24,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => setShowMaybes((prev) => !prev)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: "#f1c97f",
                    color: "#8a5800",
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                    width: "100%",
                  }}
                >
                  {showMaybes
                    ? "Maybe Matches ausblenden"
                    : `Maybe Matches anzeigen (${maybeMatches.length})`}
                </button>

                {showMaybes && (
                  <>
                    <h2
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#1663a6",
                        textAlign: "center",
                      }}
                    >
                      Offene Favoriten ({maybeMatches.length})
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
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        width: "100%",
                        gap: 12,
                        maxHeight: 260,
                        overflowY: "auto",
                        paddingRight: 6,
                      }}
                    >
                      {maybeMatches.map((m) => (
                        <MatchNameCard
                          key={m.id}
                          name={m}
                          compact
                          onClick={() => setActiveName(m)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {activeName && (
          <MatchNameModal name={activeName} onClose={() => setActiveName(null)} />
        )}
      </AppCard>
    </AppBackground>
  );
}

function getGenderStyling(gender) {
  const base = {
    bg: "linear-gradient(120deg,#f1f5fb 0%,#ffffff 100%)",
    badgeBg: "#a0a0a0",
    badgeLabel: "?",
    text: "#344861",
  };

  if ((gender || "").toLowerCase() === "m") {
    return {
      bg: "linear-gradient(120deg,#e3f0ff 0%,#ffffff 100%)",
      badgeBg: "#4a90e2",
      badgeLabel: "J",
      text: "#1663a6",
    };
  }

  if ((gender || "").toLowerCase() === "w") {
    return {
      bg: "linear-gradient(120deg,#ffe6f2 0%,#ffffff 100%)",
      badgeBg: "#ff8dcf",
      badgeLabel: "M",
      text: "#b0307a",
    };
  }

  return base;
}

function MatchNameCard({ name, onClick, compact = false }) {
  const styling = getGenderStyling(name?.gender);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: styling.bg,
        padding: compact ? "10px 12px" : "14px 18px",
        borderRadius: 14,
        fontSize: compact ? 16 : 20,
        fontWeight: 700,
        color: styling.text,
        boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
        textAlign: "center",
        border: "none",
        width: "100%",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ flex: 1 }}>{name?.name}</span>
      <span
        style={{
          padding: "4px 10px",
          borderRadius: 999,
          background: styling.badgeBg,
          color: "#fff",
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        {styling.badgeLabel}
      </span>
    </button>
  );
}

function MatchNameModal({ name, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          borderRadius: 20,
          padding: "28px 22px",
          textAlign: "center",
          position: "relative",
          boxShadow: "0 30px 50px rgba(0,0,0,0.25)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            border: "none",
            background: "transparent",
            fontSize: 22,
            cursor: "pointer",
            color: "#1663a6",
          }}
          aria-label="Schließen"
        >
          ×
        </button>
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: 1,
            fontSize: 13,
            color: "#8a96aa",
            marginBottom: 6,
          }}
        >
          Match
        </p>
        <h2
          style={{
            fontSize: 32,
            color: "#1663a6",
            marginBottom: 12,
          }}
        >
          {name?.name}
        </h2>
        <p style={{ color: "#4a4a4a", marginBottom: 24 }}>
          {name?.gender === "m"
            ? "Jungenname"
            : name?.gender === "w"
            ? "Mädchenname"
            : "Ohne Zuordnung"}
        </p>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px 16px",
            borderRadius: 12,
            border: "none",
            background: "#1663a6",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
