"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import AppBackground from "../components/AppBackground";
import { fetchAllNames } from "../utils/fetchAllNames";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";
import AppButton from "../components/AppButton";
import { useRoleGuard } from "../hooks/useRoleGuard";

export default function NameManagerPage() {
  const { user, loading: authLoading, allowed } = useRoleGuard();
  const [names, setNames] = useState([]);
  const [letter, setLetter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" | "desc"
  const [selectedName, setSelectedName] = useState(null);
  const [decisionMap, setDecisionMap] = useState({});
  const [actionBusy, setActionBusy] = useState(false);
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const dragActiveRef = useRef(false);

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // ----------------------------------------
  // LOAD NAMES
  // ----------------------------------------
  useEffect(() => {
    if (authLoading || !allowed) return;

    let cancelled = false;

    async function load() {
      const all = await fetchAllNames("all");
      if (!cancelled) setNames(all);
    }

    load();

    const reload = localStorage.getItem("reload-names");
    if (reload) {
      load().then(() => localStorage.removeItem("reload-names"));
    }

    return () => {
      cancelled = true;
    };
  }, [authLoading, allowed]);

  // ----------------------------------------
  // LOAD DECISIONS
  // ----------------------------------------
  useEffect(() => {
    if (authLoading || !allowed || !user?.id) return;

    let cancelled = false;

    async function loadAllDecisions() {
      const pageSize = 1000;
      let from = 0;
      const latest = {};

      while (true) {
        const { data, error } = await supabase
          .from("decisions")
          .select("id, name_id, decision")
          .eq("user_id", user.id)
          .order("id", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          console.error("name-manager decisions load error:", error);
          break;
        }

        if (!data || data.length === 0) break;

        for (const entry of data) {
          if (!latest[entry.name_id]) {
            latest[entry.name_id] = entry.decision;
          }
        }

        if (data.length < pageSize) break;
        from += pageSize;
      }

      if (!cancelled) {
        setDecisionMap(latest);
      }
    }

    loadAllDecisions();

    return () => {
      cancelled = true;
    };
  }, [authLoading, allowed, user?.id]);

  // Close modal on ESC
  useEffect(() => {
    if (!selectedName) return;

    function handleKey(e) {
      if (e.key === "Escape") {
        setSelectedName(null);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedName]);

  const swipeThreshold = 80;

  async function handleDecision(decision, targetName = selectedName) {
    if (!targetName || !user?.id) return;
    if (decisionMap[targetName.id] === decision) return;

    setActionBusy(true);

    const { error } = await supabase
      .from("decisions")
      .upsert(
        {
          user_id: user.id,
          name_id: targetName.id,
          decision,
        },
        { onConflict: "user_id,name_id" }
      );

    if (error) {
      console.error("save decision error:", error);
    } else {
      setDecisionMap((prev) => ({
        ...prev,
        [targetName.id]: decision,
      }));
    }

    setActionBusy(false);
  }

  async function handleClearDecision(targetName = selectedName) {
    if (!targetName || !user?.id) return;
    if (!decisionMap[targetName.id]) return;

    setActionBusy(true);

    const { error } = await supabase
      .from("decisions")
      .delete()
      .eq("user_id", user.id)
      .eq("name_id", targetName.id);

    if (error) {
      console.error("delete decision error:", error);
    } else {
      setDecisionMap((prev) => {
        const next = { ...prev };
        delete next[targetName.id];
        return next;
      });
    }

    setActionBusy(false);
  }

  if (authLoading || !allowed) {
    return <AppBackground>Loading…</AppBackground>;
  }

  // ----------------------------------------
  // FILTER + SEARCH + SORT
  // ----------------------------------------
  const filteredNames = names
    .filter((n) => {
      if (letter !== "ALL" && !n.name.toUpperCase().startsWith(letter))
        return false;
      if (search.trim() !== "" && !n.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (showOnlyOpen && decisionMap[n.id]) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  return (
    <AppBackground>
      <AppCard
        style={{
          paddingBottom: 40,
          maxHeight: "90vh",
          overflow: "hidden",
          width: "100%",
          position: "relative",
        }}
      >
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

        {/* SORT + OPEN FILTER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setShowOnlyOpen((prev) => !prev)}
            style={{
              flex: 1,
              minWidth: 140,
              padding: "6px 10px",
              borderRadius: 8,
              border: "none",
              background: showOnlyOpen ? "#35b27f" : "#e3efff",
              color: showOnlyOpen ? "white" : "#1663a6",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {showOnlyOpen ? "Nur offene (an)" : "Nur offene"}
          </button>

          <button
            onClick={() =>
              setSortOrder(sortOrder === "asc" ? "desc" : "asc")
            }
            style={{
              flex: 1,
              minWidth: 140,
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
            flex: 1,
            maxHeight: "50vh",
            overflowY: "auto",
            paddingRight: 4,
            width: "100%",
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
            <AnimatePresence presenceAffectsLayout>
              {filteredNames.map((n) => {
                const status = decisionMap[n.id] || "open";
                const statusStyle = decisionStatusStyles[status];
                const isOpen = status === "open";
                const canSwipe = showOnlyOpen && isOpen;

              return (
                <NameListRow
                  key={n.id}
                  nameData={n}
                  statusStyle={statusStyle}
                  isOpen={isOpen}
                  canSwipe={canSwipe}
                  swipeThreshold={swipeThreshold}
                  dragActiveRef={dragActiveRef}
                  onSelect={() => setSelectedName(n)}
                  onSwipeDecision={(decision) => handleDecision(decision, n)}
                  onQuickDecision={
                    isOpen
                      ? (decision) => handleDecision(decision, n)
                      : undefined
                  }
                />
              );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Add Name */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <AppButton href="/add-name" style={{ background: "#4a90e2" }}>
            Neuen Namen hinzufügen
          </AppButton>
        </div>

        {selectedName && (
          <NameDecisionModal
            name={selectedName}
            decision={decisionMap[selectedName.id] || null}
            busy={actionBusy}
            onSelect={(decision) => handleDecision(decision, selectedName)}
            onRemove={() => handleClearDecision(selectedName)}
            onClose={() => setSelectedName(null)}
          />
        )}
      </AppCard>
    </AppBackground>
  );
}

const decisionStatusStyles = {
  like: { label: "Like", bg: "rgba(53,178,127,0.15)", color: "#1e7a57" },
  maybe: { label: "Maybe", bg: "rgba(245,178,57,0.2)", color: "#b8781d" },
  nope: { label: "Nope", bg: "rgba(224,93,93,0.2)", color: "#aa3b3b" },
  open: { label: "Offen", bg: "#e6edf8", color: "#466a99" },
};

function NameListRow({
  nameData,
  statusStyle,
  isOpen,
  canSwipe,
  swipeThreshold,
  dragActiveRef,
  onSelect,
  onSwipeDecision,
  onQuickDecision,
}) {
  const controls = useAnimation();
  const pendingRef = useRef(null);
  const [pendingDecision, setPendingDecision] = useState(null);

  useEffect(() => {
    if (!canSwipe && pendingRef.current !== null) {
      pendingRef.current = null;
      setPendingDecision(null);
    }
  }, [canSwipe]);

  const baseBackground = isOpen ? "#f7fbff" : "white";
  const highlightBackground =
    pendingDecision && swipeHighlight[pendingDecision]
      ? swipeHighlight[pendingDecision]
      : baseBackground;

  return (
    <motion.div
      layout
      layoutId={`name-${nameData.id}`}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (dragActiveRef.current) return;
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      animate={controls}
      exit={{ x: 220, opacity: 0 }}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: highlightBackground,
        padding: "10px 12px",
        marginBottom: 6,
        borderRadius: 8,
        border: "1px solid #dce7f7",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      drag={canSwipe ? "x" : false}
      dragConstraints={canSwipe ? { left: -120, right: 120 } : undefined}
      dragElastic={0.2}
      dragMomentum={false}
      transition={{
        layout: { type: "spring", stiffness: 400, damping: 32 },
      }}
      whileTap={{ scale: canSwipe ? 0.98 : 1 }}
      onDrag={(event, info) => {
        if (!canSwipe) return;
        if (info.offset.x > swipeThreshold) {
          if (pendingRef.current !== "like") {
            pendingRef.current = "like";
            setPendingDecision("like");
          }
        } else if (info.offset.x < -swipeThreshold) {
          if (pendingRef.current !== "nope") {
            pendingRef.current = "nope";
            setPendingDecision("nope");
          }
        } else if (pendingRef.current !== null) {
          pendingRef.current = null;
          setPendingDecision(null);
        }
      }}
      onDragStart={() => {
        if (!canSwipe) return;
        dragActiveRef.current = true;
      }}
      onDragEnd={(event, info) => {
        if (!canSwipe) return;
        dragActiveRef.current = false;

        if (info.offset.x > swipeThreshold) {
          onSwipeDecision("like");
          pendingRef.current = null;
          setPendingDecision(null);
          return;
        }

        if (info.offset.x < -swipeThreshold) {
          onSwipeDecision("nope");
          pendingRef.current = null;
          setPendingDecision(null);
          return;
        }

        pendingRef.current = null;
        setPendingDecision(null);

        controls.start({
          x: 0,
          transition: { type: "spring", stiffness: 500, damping: 40 },
        });
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1663a6" }}>
            {nameData.name}
          </span>
          <span
            style={{
              alignSelf: "flex-start",
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              background: statusStyle.bg,
              color: statusStyle.color,
            }}
          >
            {statusStyle.label}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          alignItems: "flex-end",
        }}
      >
        <span
          style={{
            padding: "4px 8px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: "white",
            background:
              nameData.gender === "m"
                ? "#4a90e2"
                : nameData.gender === "w"
                ? "#ff8dcf"
                : "#aaa",
          }}
        >
          {nameData.gender === "m" ? "J" : nameData.gender === "w" ? "M" : "?"}
        </span>

        {isOpen && onQuickDecision && (
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            {quickActions.map((action) => (
              <button
                key={action.type}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onQuickDecision(action.type);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "none",
                  background: action.bg,
                  color: action.color,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
                aria-label={action.label}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const swipeHighlight = {
  like: "rgba(53,178,127,0.18)",
  nope: "rgba(224,93,93,0.25)",
};

const quickActions = [
  { type: "nope", label: "✕", bg: "#ffe3e3", color: "#bd2d2d" },
  { type: "maybe", label: "?", bg: "#fff4d6", color: "#b17000" },
  { type: "like", label: "✓", bg: "#dff8ec", color: "#1e7a57" },
];

const decisionStyles = {
  like: {
    label: "Like",
    color: "#35b27f",
  },
  maybe: {
    label: "Maybe",
    color: "#f5b239",
  },
  nope: {
    label: "Nope",
    color: "#e05d5d",
  },
};

function NameDecisionModal({ name, decision, busy, onSelect, onRemove, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "white",
          borderRadius: 18,
          padding: "28px 22px 22px",
          position: "relative",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            border: "none",
            background: "transparent",
            fontSize: 20,
            cursor: "pointer",
            color: "#1663a6",
          }}
          aria-label="Schließen"
        >
          ×
        </button>

        <p
          style={{
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: "#7d8fa6",
            marginBottom: 6,
          }}
        >
          Entscheidung für
        </p>
        <h2
          style={{
            fontSize: 30,
            color: "#1663a6",
            marginBottom: 22,
            fontWeight: 800,
          }}
        >
          {name.name}
        </h2>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {Object.entries(decisionStyles).map(([key, config]) => {
            const active = decision === key;
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                disabled={busy}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  borderRadius: 10,
                  border: "none",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: busy ? "not-allowed" : "pointer",
                  background: active ? config.color : "#e3efff",
                  color: active ? "white" : "#1663a6",
                  opacity: busy ? 0.6 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onRemove}
          disabled={!decision || busy}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #d6dfea",
            background: decision ? "white" : "#f3f5f9",
            color: decision ? "#b93131" : "#9aa7bb",
            fontWeight: 600,
            cursor: !decision || busy ? "not-allowed" : "pointer",
            marginBottom: 12,
          }}
        >
          Entscheidung verwerfen
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#1663a6",
            color: "white",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
