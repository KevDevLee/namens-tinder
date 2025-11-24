"use client";

import { Suspense, useState, useEffect } from "react";

import { supabase } from "../../lib/supabaseClient";
import {
  motion,
  useMotionValue,
  useAnimation,
  useTransform,
} from "framer-motion";
import { fetchAllNames } from "../utils/fetchAllNames";
import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import AppButton from "../components/AppButton";
import BackButton from "../components/BackButton";
import { shuffleArray } from "../utils/shuffle";
import { useSearchParams } from "next/navigation";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { getProfileIdByRole } from "../utils/getProfileIdByRole";


// -----------------------------------------------------------------------------
// WRAPPER — wegen useSearchParams
// -----------------------------------------------------------------------------
export default function SwipeHerPage() {
  return (
    <Suspense fallback={<AppBackground>Loading…</AppBackground>}>
      <SwipeHerContent />
    </Suspense>
  );
}



// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------
function SwipeHerContent() {
  const { user, allowed, loading } = useRoleGuard("mama");
  const [names, setNames] = useState([]);
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [showUndo, setShowUndo] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [matchName, setMatchName] = useState("");

  const [lastName, setLastName] = useState("");   // ✔ SSR-safe

  useEffect(() => {
    const stored = window.localStorage.getItem("babyLastName");
    if (stored) setLastName(stored);
  }, []);                                        // ✔ load after mount

  const searchParams = useSearchParams();
  const genderFilter = searchParams.get("g") || "all";

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();

  const likeOpacity = useTransform(x, v => v > 0 ? Math.min(v / 140, 1) : 0);
  const nopeOpacity = useTransform(x, v => v < 0 ? Math.min(Math.abs(v) / 140, 1) : 0);

  const [otherUserId, setOtherUserId] = useState(null);
  const current = names[index];

  useEffect(() => {
    x.set(0);
    y.set(0);
    controls.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
  }, [current?.id, controls, x, y]);



  // --------------------------------------------------
  // Namen laden (gefiltert, ungelikt, shuffled)
  // --------------------------------------------------
  useEffect(() => {
    if (!user?.id) return;

    async function loadNames() {
      const allNames = await fetchAllNames(genderFilter);

      const { data: decisionsData, error } = await supabase
        .from("decisions")
        .select("name_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("loadNames her error:", error);
        setNames(allNames);
        return;
      }

      const decidedIds = new Set((decisionsData || []).map((d) => d.name_id));
      const remaining = allNames.filter((n) => !decidedIds.has(n.id));

      setNames(shuffleArray(remaining));
    }

    loadNames();
  }, [genderFilter, user?.id]);

  useEffect(() => {
    async function loadOther() {
      const papaId = await getProfileIdByRole("papa");
      setOtherUserId(papaId);
    }

    loadOther();
  }, []);



  // --------------------------------------------------
  // nextCard
  // --------------------------------------------------
  function nextCard() {
    setIndex(prev => (prev + 1) % names.length);
    x.set(0);
    y.set(0);
    controls.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
    setShowUndo(false);
  }



  // --------------------------------------------------
  // Entscheidung speichern (like/nope/maybe)
  // --------------------------------------------------
  async function saveDecision(decision) {
    if (!current || !user?.id) return;

    await supabase.from("decisions").insert({
      user_id: user.id,
      name_id: current.id,
      decision,
    });
  }



  // --------------------------------------------------
  // LIKE
  // --------------------------------------------------
  async function like() {
    if (!current) return;

    setHistory((prev) => [
      ...prev,
      { nameId: current.id, decision: "like", index },
    ]);
    setShowUndo(true);

    await saveDecision("like");

    if (otherUserId) {
      const { data: hisDecision } = await supabase
        .from("decisions")
        .select("id")
        .eq("user_id", otherUserId)
        .eq("name_id", current.id)
        .eq("decision", "like")
        .limit(1);

      if (hisDecision?.length > 0) {
        setMatchName(current.name);
        setShowMatch(true);
      }
    }

    await controls.start({
      x: 300,
      rotate: 20,
      opacity: 0,
      transition: { duration: 0.3 }
    });

    nextCard();
  }



  // --------------------------------------------------
  // NOPE
  // --------------------------------------------------
  async function nope() {
    if (!current) return;

    setHistory((prev) => [
      ...prev,
      { nameId: current.id, decision: "nope", index },
    ]);
    setShowUndo(true);

    await saveDecision("nope");

    await controls.start({
      x: -300,
      rotate: -20,
      opacity: 0,
      transition: { duration: 0.3 }
    });

    nextCard();
  }



  // --------------------------------------------------
  // MAYBE
  // --------------------------------------------------
  async function skip() {
    if (!current) return;

    setHistory((prev) => [
      ...prev,
      { nameId: current.id, decision: "maybe", index },
    ]);
    setShowUndo(true);

    await saveDecision("maybe");

    await controls.start({
      y: -250,
      opacity: 0,
      rotate: 0,
      transition: { duration: 0.25 }
    });

    y.set(0);
    nextCard();
  }



  // --------------------------------------------------
  // Drag-End Handler
  // --------------------------------------------------
  async function handleDragEnd(_, info) {
    const { offset, velocity } = info;
    const xOffset = offset.x;
    const yOffset = offset.y;

    const fastRight = velocity.x > 1000;
    const fastLeft = velocity.x < -1000;
    const fastUp = velocity.y < -1000;

    if ((xOffset > 120 && yOffset > -80 && yOffset < 80) || fastRight) {
      return like();
    }

    if ((xOffset < -120 && yOffset > -80 && yOffset < 80) || fastLeft) {
      return nope();
    }

    if (yOffset < -140 || fastUp) {
      return skip();
    }

    controls.start({
      x: 0,
      y: 0,
      rotate: 0,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    });
  }

  async function undoLast() {
    if (!user?.id || history.length === 0) return;
    const last = history[history.length - 1];

    await supabase
      .from("decisions")
      .delete()
      .eq("user_id", user.id)
      .eq("name_id", last.nameId)
      .eq("decision", last.decision);

    setHistory((prev) => prev.slice(0, -1));
    setShowMatch(false);
    setIndex(last.index);
    x.set(0);
    y.set(0);
    controls.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
    setShowUndo(false);
  }



  // --------------------------------------------------
  // keine Namen übrig
  // --------------------------------------------------
  if (loading || !allowed || !user) {
    return <AppBackground>Loading…</AppBackground>;
  }

  if (!current) {
    return (
      <AppBackground>
        <AppCard style={{ textAlign: "center", paddingBottom: 40 }}>
          <h2 style={{ color: "#1663a6", fontSize: 24, marginBottom: 12 }}>
            Keine weiteren Namen!
          </h2>

          <AppButton href="/" style={{ marginBottom: 12 }}>
            Zur Startseite
          </AppButton>

          <AppButton href="/matches" style={{ background: "#7ab6ff" }}>
            Matches anzeigen
          </AppButton>
        </AppCard>
      </AppBackground>
    );
  }



  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <AppBackground>
      <AppCard
        style={{
          paddingBottom: 40,
          position: "relative",
        }}
      >
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-start" }}>
          <BackButton />
        </div>

        <h1
          style={{
            color: "#1663a6",
            fontSize: 28,
            marginBottom: 12,
            marginTop: 6,
            userSelect: "none",
            cursor: "default",
          }}
        >
          Mama Swipe
        </h1>


        {/* SWIPE CARD */}
        <motion.div
          key={current?.id || current?.name}
          drag
          dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
          dragElastic={0.1}
          dragMomentum={false}
          animate={controls}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          onDragEnd={handleDragEnd}
          style={{
            x,
            y,
            width: "100%",
            maxWidth: 260,
            height: 360,
            background: "linear-gradient(135deg,#ffffff,#e8f3ff)",
            borderRadius: 24,
            boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 40,
            fontWeight: "700",
            color: "#1663a6",
            position: "relative",
            userSelect: "none",
            margin: "0 auto 24px auto",
          }}
        >
          {current?.gender && (
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 0,
                height: 0,
                borderStyle: "solid",
                borderWidth: "0 50px 50px 0",
                borderColor: `transparent ${
                  current.gender === "m" ? "#7ab6ff" : "#ff96cf"
                } transparent transparent`,
                borderTopRightRadius: 24,
              }}
            />
          )}
          {current?.gender && (
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                color: "white",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {current.gender === "m" ? "👦" : "👧"}
            </span>
          )}
          <motion.div
            style={{
              opacity: likeOpacity,
              position: "absolute",
              top: 18,
              left: 18,
              padding: "8px 14px",
              fontSize: 22,
              borderRadius: 12,
              background: "rgba(76,217,100,0.25)",
              border: "2px solid #4cd964",
              color: "#4cd964",
              transform: "rotate(8deg)",
              pointerEvents: "none",
            }}
          >
            Ja ❤️
          </motion.div>

          <motion.div
            style={{
              opacity: nopeOpacity,
              position: "absolute",
              top: 18,
              right: 18,
              padding: "8px 14px",
              fontSize: 22,
              borderRadius: 12,
              background: "rgba(255,59,48,0.25)",
              border: "2px solid #ff3b30",
              color: "#ff3b30",
              transform: "rotate(-8deg)",
              pointerEvents: "none",
            }}
          >
            Nein ✖️
          </motion.div>

          <div style={{ textAlign: "center" }}>
            <div>{current.name} {lastName}</div>
          </div>
        </motion.div>


            }}
          >
            Undo
          </AppButton>
        </div>

      </AppCard>
    </AppBackground>
  );
}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              width: "100%",
              justifyContent: "center",
              flexWrap: "nowrap",
            }}
          >
            <AppButton
              onClick={nope}
              style={{ background: "#ff4d4d", flex: 1, minWidth: 0 }}
            >
              Nope
            </AppButton>

            <AppButton
              onClick={skip}
              style={{
                background: "#b0b0b0",
                flex: 1,
                minWidth: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span>Maybe</span>
            </AppButton>

            <AppButton
              onClick={like}
              style={{ background: "#4cd964", flex: 1, minWidth: 0 }}
            >
              Like
            </AppButton>
          </div>

          <AppButton
            onClick={undoLast}
            style={{
              background: "#ffe7ba",
              color: "#7a5200",
              fontSize: 14,
              padding: "8px 12px",
              width: 120,
              opacity: showUndo && history.length > 0 ? 0.5 : 0,
              visibility: showUndo && history.length > 0 ? "visible" : "hidden",
              pointerEvents: showUndo && history.length > 0 ? "auto" : "none",
              transition: "opacity 0.2s ease",
            }}
          >
            Undo
          </AppButton>
        </div>
