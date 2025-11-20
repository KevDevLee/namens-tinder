"use client";

import { motion } from "framer-motion";
import AppBackground from "./components/AppBackground";
import AppCard from "./components/AppCard";
import AppButton from "./components/AppButton";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [gender, setGender] = useState("all");

  // Load stored gender
  useEffect(() => {
    const stored = window.localStorage.getItem("genderFilter");
    if (stored) setGender(stored);
  }, []);

  // Save on change
  useEffect(() => {
    window.localStorage.setItem("genderFilter", gender);
  }, [gender]);

  // --- Button Style Helper ---
  const getButtonStyle = (isActive, activeColor, inactiveColor) => ({
    padding: "10px 16px",
    borderRadius: 12,
    border: "none",
    fontSize: 16,
    fontWeight: 700,
    transition: "all 0.25s ease",
    background: isActive ? activeColor : inactiveColor,
    color: isActive ? "white" : "rgba(0,0,0,0.45)",
    boxShadow: isActive
      ? "0 4px 12px rgba(0,0,0,0.25)"
      : "inset 0 0 0 1px rgba(0,0,0,0.08)",
    opacity: isActive ? 1 : 0.6,
  });

  return (
    <AppBackground>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <AppCard>
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: "#1663a6",
              marginBottom: 6,
            }}
          >
            Swipe. Match. Name.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            style={{
              fontSize: 16,
              color: "#4a4a4a",
              maxWidth: 270,
              marginBottom: 28,
              lineHeight: "1.4",
            }}
          >
            Findet gemeinsam euren perfekten Babynamen.
          </motion.p>

          {/* --- Gender Selector --- */}
          <div
            style={{
              background: "#ffffffbb",
              padding: "14px 16px",
              borderRadius: 14,
              marginBottom: 28,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Junge */}
            <button
              onClick={() => setGender("m")}
              style={getButtonStyle(
                gender === "m",
                "#4a90e2",
                "#e5efff"
              )}
            >
              👦 Junge
            </button>

            {/* Mädchen */}
            <button
              onClick={() => setGender("w")}
              style={getButtonStyle(
                gender === "w",
                "#ff78c8",
                "#ffe5f4"
              )}
            >
              👧 Mädchen
            </button>

            {/* Alle */}
            <button
              onClick={() => setGender("all")}
              style={getButtonStyle(
                gender === "all",
                "#7ab6ff",
                "#e6f1ff"
              )}
            >
              ✨ Alle
            </button>
          </div>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 16,
            }}
          >
            <AppButton href={`/swipe-me?g=${gender}`}>Papa Swipe</AppButton>

            <AppButton
              href={`/swipe-her?g=${gender}`}
              style={{ background: "#7ab6ff" }}
            >
              Mama Swipe
            </AppButton>

            <AppButton
              href="/matches"
              style={{
                background: "#cfe7ff",
                color: "#1663a6",
                marginTop: 10,
              }}
            >
              Matches
            </AppButton>
          </motion.div>
        </AppCard>
      </motion.div>
    </AppBackground>
  );
}
