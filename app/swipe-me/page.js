"use client";

import { useState, useEffect } from "react";
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

export default function SwipeMePage() {
  const [names, setNames] = useState([]);
  const [index, setIndex] = useState(0);
  const [myLikes, setMyLikes] = useState([]);

  const [showMatch, setShowMatch] = useState(false);
  const [matchName, setMatchName] = useState("");

  const searchParams = useSearchParams();
  const genderFilter = searchParams.get("g") || "all";

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();

  const likeOpacity = useTransform(x, (v) =>
    v > 0 ? Math.min(v / 140, 1) : 0
  );
  const nopeOpacity = useTransform(x, (v) =>
    v < 0 ? Math.min(Math.abs(v) / 140, 1) : 0
  );

  const current = names[index];

  // 🔹 Namen + bereits gelikte Namen laden + filtern + shufflen
  useEffect(() => {
    async function load() {
      const { data: namesData } = await supabase
        .from("names")
        .select("*")
        .order("id");

      const { data: likesData } = await supabase
        .from("likes")
        .select("name_id")
        .eq("user", "me");

      if (!namesData) return;

      const likedIds = new Set((likesData || []).map((r) => r.name_id));

      const filtered = namesData.filter(
        (n) =>
          (genderFilter === "all" || n.gender === genderFilter) &&
          !likedIds.has(n.id)
      );

      setMyLikes((likesData || []).map((r) => r.name_id));
      setNames(shuffleArray(filtered));
    }

    load();
  }, [genderFilter]);

  // 🔹 Karte zurücksetzen + nächste Karte
  function nextCard() {
    setIndex((prev) => (prev + 1) % names.length);
    x.set(0);
    y.set(0);
    controls.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
  }

  // 🔹 LIKE
  async function like() {
    if (!current) return;

    // 1. Like speichern
    const { error } = await supabase.from("likes").insert({
      user: "me",
      name_id: current.id,
    });

    if (error) {
      console.error("INSERT ERROR (me):", error);
      return;
    }

    // 2. Prüfen, ob Mama denselben Namen schon geliked hat
    const { data: herLikeRows } = await supabase
      .from("likes")
      .select("id")
      .eq("user", "her")
      .eq("name_id", current.id)
      .limit(1);

    if (herLikeRows && herLikeRows.length > 0) {
      setMatchName(current.name);
      setShowMatch(true);
    }

    // 3. Lokal updaten
    setMyLikes((prev) => [...prev, current.id]);

    // 4. Animation → rechts raus
    await controls.start({
      x: 300,
      rotate: 20,
      opacity: 0,
      transition: { duration: 0.3 },
    });

    nextCard();
  }

  // 🔹 NOPE
  async function nope() {
    await controls.start({
      x: -300,
      rotate: -20,
      opacity: 0,
      transition: { duration: 0.3 },
    });

    nextCard();
  }

  // 🔹 SPÄTER (Skip)
  async function skip() {
    await controls.start({
      y: -250,
      opacity: 0,
      rotate: 0,
      transition: { duration: 0.25 },
    });

    y.set(0);
    nextCard();
  }

  // 🔹 Swipe-Handling
  async function handleDragEnd(_, info) {
    const xOffset = info.offset.x;

    if (xOffset > 100) return like();
    if (xOffset < -100) return nope();

    controls.start({
      x: 0,
      rotate: 0,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    });
  }

  if (!current) {
    return <AppBackground>Loading…</AppBackground>;
  }

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
              damping: 18,
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
          style={{
            color: "#1663a6",
            fontSize: 28,
            marginBottom: 12,
            marginTop: 6,
          }}
        >
          Papa Swipe
        </h1>

        {/* SWIPE-KARTE */}
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
          {/* LIKE Overlay – links */}
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

          {/* NOPE Overlay – rechts */}
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
        <div
          style={{
            display: "flex",
            gap: 16,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <AppButton onClick={nope} style={{ background: "#ff4d4d" }}>
            Nope
          </AppButton>

          <AppButton onClick={skip} style={{ background: "#b0b0b0" }}>
            Später
          </AppButton>

          <AppButton onClick={like} style={{ background: "#4cd964" }}>
            Like
          </AppButton>
        </div>
      </AppCard>
    </AppBackground>
  );
}
