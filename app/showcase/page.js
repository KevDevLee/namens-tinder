"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useAnimation,
  useTransform,
} from "framer-motion";

import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";
import AppButton from "../components/AppButton";
import { fetchAllNames } from "../utils/fetchAllNames";
import { shuffleArray } from "../utils/shuffle";

export default function ShowcasePage() {
  const [names, setNames] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();
  const likeOpacity = useTransform(x, (v) =>
    v > 0 ? Math.min(v / 140, 1) : 0
  );
  const nopeOpacity = useTransform(x, (v) =>
    v < 0 ? Math.min(Math.abs(v) / 140, 1) : 0
  );
  const maybeOpacity = useTransform(y, (v) =>
    v < 0 ? Math.min(Math.abs(v) / 120, 1) : 0
  );
  const [pendingDecision, setPendingDecision] = useState(null);
  const current = names[index] || null;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const all = await fetchAllNames("all");
      setNames(shuffleArray(all));
      setIndex(0);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    controls.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
    x.set(0);
    y.set(0);
    setPendingDecision(null);
  }, [index, controls, x, y]);

  const advanceCard = () => {
    if (names.length === 0) return;
    setIndex((prev) => {
      const next = prev + 1;
      if (next >= names.length) {
        const reshuffled = shuffleArray([...names]);
        setNames(reshuffled);
        return 0;
      }
      return next;
    });
  };

  async function animateAndAdvance(config) {
    await controls.start(config);
    advanceCard();
  }

  const like = () => {
    if (!current) return;
    animateAndAdvance({
      x: 300,
      rotate: 20,
      opacity: 0,
      transition: { duration: 0.3 },
    });
  };

  const nope = () => {
    if (!current) return;
    animateAndAdvance({
      x: -300,
      rotate: -20,
      opacity: 0,
      transition: { duration: 0.3 },
    });
  };

  const maybe = () => {
    if (!current) return;
    animateAndAdvance({
      y: -250,
      opacity: 0,
      rotate: 0,
      transition: { duration: 0.25 },
    });
  };

  const handleDragEnd = (_, info) => {
    const { offset, velocity } = info;
    const fastUp = velocity.y < -1000;
    const withinBand = offset.y > -80 && offset.y < 80;

    if (withinBand && offset.x > 120) {
      return like();
    }

    if (withinBand && offset.x < -120) {
      return nope();
    }

    if (offset.y < -80 || fastUp) {
      return maybe();
    }

    controls.start({
      x: 0,
      y: 0,
      rotate: 0,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    });
  };

  const handleDrag = (_, info) => {
    if (info.offset.x > 95) {
      setPendingDecision("like");
    } else if (info.offset.x < -95) {
      setPendingDecision("nope");
    } else if (info.offset.y < -80) {
      setPendingDecision("maybe");
    } else {
      setPendingDecision(null);
    }
  };

  const baseCardBackground = "linear-gradient(135deg,#ffffff,#e8f3ff)";
  const likeBackground = "linear-gradient(135deg,#ebfff5,#d6f8e5)";
  const nopeBackground = "linear-gradient(135deg,#fff0f0,#ffd8d8)";
  const maybeBackground = "linear-gradient(135deg,#fffbe6,#fff0bf)";
  const cardBackground =
    pendingDecision === "like"
      ? likeBackground
      : pendingDecision === "nope"
      ? nopeBackground
      : pendingDecision === "maybe"
      ? maybeBackground
      : baseCardBackground;

  return (
    <AppBackground>
      <AppCard style={{ paddingBottom: 40, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <BackButton />
          <AppButton
            onClick={() => {
              setNames((prev) => shuffleArray([...prev]));
              setIndex(0);
            }}
            style={{
              background: "#e3f0ff",
              color: "#1663a6",
              fontSize: 14,
              padding: "8px 10px",
            }}
          >
            Neu mischen
          </AppButton>
        </div>

        <h1
          style={{
            color: "#1663a6",
            fontSize: 28,
            marginBottom: 8,
            marginTop: 6,
            textAlign: "center",
            fontWeight: 800,
          }}
        >
          Demo-Swipe
        </h1>
        <p
          style={{
            color: "#4a4a4a",
            marginBottom: 20,
            textAlign: "center",
            fontSize: 14,
          }}
        >
          Teste das Swipen mit zufälligen Namen. Deine Entscheidungen werden
          nicht gespeichert.
        </p>

        {loading ? (
          <p style={{ textAlign: "center", color: "#1663a6" }}>Lade Namen…</p>
        ) : !current ? (
          <p style={{ textAlign: "center", color: "#1663a6" }}>
            Keine Namen gefunden.
          </p>
        ) : (
          <>
            <motion.div
              key={current.id}
              drag
              dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
              dragElastic={0.1}
              dragMomentum={false}
              animate={controls}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              style={{
                x,
                y,
                width: "100%",
                maxWidth: 260,
                height: 360,
                background: cardBackground,
                borderRadius: 24,
                boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 40,
                fontWeight: 700,
                color: "#1663a6",
                position: "relative",
                userSelect: "none",
                margin: "0 auto 24px auto",
              }}
            >
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

              <motion.div
                style={{
                  opacity: maybeOpacity,
                  position: "absolute",
                  bottom: 24,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "6px 16px",
                  fontSize: 20,
                  borderRadius: 12,
                  background: "rgba(255,214,10,0.25)",
                  border: "2px solid #ffd60a",
                  color: "#b88600",
                  pointerEvents: "none",
                }}
              >
                Vielleicht ?
              </motion.div>

              <div style={{ textAlign: "center" }}>
                <div>{current.name}</div>
              </div>
            </motion.div>

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
                  onClick={maybe}
                  style={{ background: "#b0b0b0", flex: 1, minWidth: 0 }}
                >
                  Maybe
                </AppButton>

                <AppButton
                  onClick={like}
                  style={{ background: "#4cd964", flex: 1, minWidth: 0 }}
                >
                  Like
                </AppButton>
              </div>
            </div>
          </>
        )}
      </AppCard>
    </AppBackground>
  );
}
