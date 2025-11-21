"use client";

import {
  Suspense,
  useState,
  useEffect
} from "react";

import { supabase } from "../../lib/supabaseClient";
import {
  motion,
  useMotionValue,
  useAnimation,
  useTransform
} from "framer-motion";

import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import AppButton from "../components/AppButton";
import BackButton from "../components/BackButton";
import { shuffleArray } from "../utils/shuffle";
import { useSearchParams } from "next/navigation";


// -----------------------------------------------------------------------------
// WRAPPER (Vercel fix)
// -----------------------------------------------------------------------------
export default function SwipeMePage() {
  return (
    <Suspense fallback={<AppBackground>Loading…</AppBackground>}>
      <SwipeMeContent />
    </Suspense>
  );
}



// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------
function SwipeMeContent() {
  const [names, setNames] = useState([]);
  const [index, setIndex] = useState(0);

  const [showMatch, setShowMatch] = useState(false);
  const [matchName, setMatchName] = useState("");

  // Secret Stats Unlock
  const [tapCount, setTapCount] = useState(0);
  const [showStatsButton, setShowStatsButton] = useState(false);

  const searchParams = useSearchParams();
  const genderFilter = searchParams.get("g") || "all";

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();

  const likeOpacity = useTransform(x, v => v > 0 ? Math.min(v / 140, 1) : 0);
  const nopeOpacity = useTransform(x, v => v < 0 ? Math.min(Math.abs(v) / 140, 1) : 0);

  const current = names[index];



  // ---------------------------------------------------------------------------
  // Namen laden (gefiltert + ungelikt + shuffled)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadNames() {
      // Alle Namen holen
      const { data: namesData } = await supabase
        .from("names")
        .select("*")
        .order("id");

      // Entscheidungen dieses Users holen
      const { data: decisionsData } = await supabase
        .from("decisions")
        .select("name_id")
        .eq("user", "me");

      if (!namesData) return;

      const decidedIds = new Set((decisionsData || []).map(r => r.name_id));

      // Filter anwenden
      const filtered = namesData.filter(
        n =>
          (genderFilter === "all" || n.gender === genderFilter) &&
          !decidedIds.has(n.id)
      );

      setNames(shuffleArray(filtered));
    }

    loadNames();
  }, [genderFilter]);



  // ---------------------------------------------------------------------------
  // Nächste Karte
  // ---------------------------------------------------------------------------
  function nextCard() {
    setIndex(prev => (prev + 1) % names.length);
    x.set(0);
    y.set(0);
    controls.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
  }



  // ---------------------------------------------------------------------------
  // Entscheidung speichern (like/nope/maybe)
  // ---------------------------------------------------------------------------
  async function saveDecision(decision) {
    if (!current) return;

    await supabase.from("decisions").insert({
      user: "me",
      name_id: current.id,
      decision
    });
  }



  // ---------------------------------------------------------------------------
  // LIKE
  // ---------------------------------------------------------------------------
  async function like() {
    if (!current) return;

    await saveDecision("like");

    // Prüfen ob Mama auch likte
    const { data: herDecision } = await supabase
      .from("decisions")
      .select("id")
      .eq("user", "her")
      .eq("name_id", current.id)
      .eq("decision", "like")
      .limit(1);

    if (herDecision?.length > 0) {
      setMatchName(current.name);
      setShowMatch(true);
    }

    await controls.start({
      x: 300,
      rotate: 20,
      opacity: 0,
      transition: { duration: 0.3 }
    });

    nextCard();
  }



  // ---------------------------------------------------------------------------
  // NOPE
  // ---------------------------------------------------------------------------
  async function nope() {
    await saveDecision("nope");

    await controls.start({
      x: -300,
      rotate: -20,
      opacity: 0,
      transition: { duration: 0.3 }
    });

    nextCard();
  }



  // ---------------------------------------------------------------------------
  // MAYBE (Später)
  // ---------------------------------------------------------------------------
  async function skip() {
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



  // ---------------------------------------------------------------------------
  // SWIPE per Drag
  // ---------------------------------------------------------------------------
  async function handleDragEnd(_, info) {
    const xOffset = info.offset.x;

    if (xOffset > 100) return like();
    if (xOffset < -100) return nope();

    controls.start({
      x: 0,
      rotate: 0,
      transition: { type: "spring", stiffness: 260, damping: 22 }
    });
  }



  // ---------------------------------------------------------------------------
  // keine Namen übrig
  // ---------------------------------------------------------------------------
  if (!current) {
    return (
      <AppBackground>
        <AppCard style={{ textAlign: "center", paddingBottom: 40 }}>
          <h2 style={{ color: "#1663a6", fontSize: 24, marginBottom: 12 }}>
            Keine weiteren Namen!
          </h2>

          <p style={{ color: "#555", marginBottom: 24 }}>
            Ihr habt alle passenden Namen bewertet.
          </p>

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



  // ---------------------------------------------------------------------------
  // Secret Stats Tap
  // ---------------------------------------------------------------------------
  function handleSecretTap() {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 5) setShowStatsButton(true);
  }



  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <AppBackground>

      {/* MATCH POPUP */}
      {showMatch && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              duration: 0.28,
              type: "spring",
              stiffness: 260,
              damping: 18
            }}
            style={{
              background: "white",
              borderRadius: 24,
              padding: "22px 26px 18px",
              width: "80%",
              maxWidth: 320,
              textAlign: "center",
              boxShadow: "0 14px 32px rgba(0,0,0,0.35)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -26,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 40,
              }}
            >
              💞
            </div>

            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#1663a6",
                marginTop: 10,
                marginBottom: 8,
              }}
            >
              Es ist ein Match! ✨
            </h2>

            <p style={{ fontSize: 16, marginBottom: 12, color: "#555" }}>
              Ihr beide mögt den Namen:
            </p>

            <p
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#1663a6",
                marginBottom: 18,
              }}
            >
              {matchName}
            </p>

            <button
              onClick={() => setShowMatch(false)}
              style={{
                padding: "10px 18px",
                fontSize: 16,
                borderRadius: 999,
                border: "none",
                background: "#4a90e2",
                color: "white",
                fontWeight: 600,
                boxShadow: "0 6px 14px rgba(0,0,0,0.2)",
              }}
            >
              Weiter swipen
            </button>
          </motion.div>
        </div>
      )}



      <AppCard style={{ paddingBottom: 40, position: "relative" }}>
        <BackButton />

        <h1
          onClick={handleSecretTap}
          style={{
            color: "#1663a6",
            fontSize: 28,
            marginBottom: 12,
            marginTop: 6,
            userSelect: "none",
            cursor: "default",
          }}
        >
          Papa Swipe
        </h1>



        {/* SWIPE CARD */}
        <motion.div
          drag="x"
          animate={controls}
          onDragEnd={handleDragEnd}
          style={{
            x,
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
          {/* LIKE (links) */}
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

          {/* NOPE (rechts) */}
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

          {current.name}
        </motion.div>



        {/* BUTTONS */}
        <div style={{
          display: "flex",
          gap: 16,
          width: "100%",
          justifyContent: "center"
        }}>
          <AppButton onClick={nope} style={{ background: "#ff4d4d" }}>
            Nope
          </AppButton>

          <AppButton onClick={skip} style={{ background: "#b0b0b0" }}>
            Vielleicht
          </AppButton>

          <AppButton onClick={like} style={{ background: "#4cd964" }}>
            Like
          </AppButton>
        </div>

      </AppCard>



      {/* SECRET STATS BUTTON */}
      {showStatsButton && (
        <motion.a
          href="/stats"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed",
            bottom: 22,
            right: 22,
            background: "#4a90e2",
            color: "white",
            fontSize: 16,
            padding: "12px 16px",
            borderRadius: 12,
            textDecoration: "none",
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            fontWeight: 600,
          }}
        >
          📊 Stats
        </motion.a>
      )}

    </AppBackground>
  );
}
