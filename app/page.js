"use client";

import { motion } from "framer-motion";
import AppBackground from "./components/AppBackground";
import AppCard from "./components/AppCard";
import AppButton from "./components/AppButton";
import Link from "next/link";
import { useState, useEffect } from "react";


export default function Home() {
  const [gender, setGender] = useState("all");

useEffect(() => {
  const stored = window.localStorage.getItem("genderFilter");
  if (stored) setGender(stored);
}, []);

useEffect(() => {
  window.localStorage.setItem("genderFilter", gender);
}, [gender]);

  return (
    <AppBackground>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <AppCard>
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

          {/* Gender Filter */}
<div
  style={{
    background: "#ffffffaa",
    padding: "12px 16px",
    borderRadius: 12,
    marginBottom: 24,
    display: "flex",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
    backdropFilter: "blur(6px)",
  }}
>
  <button
    onClick={() => setGender("m")}
    style={{
      padding: "8px 14px",
      borderRadius: 10,
      border: "none",
      background: gender === "m" ? "#4a90e2" : "#dbe9ff",
      color: gender === "m" ? "white" : "#1663a6",
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    👦 Junge
  </button>

  <button
    onClick={() => setGender("w")}
    style={{
      padding: "8px 14px",
      borderRadius: 10,
      border: "none",
      background: gender === "w" ? "#ff97d1" : "#ffe4f4",
      color: gender === "w" ? "white" : "#a61c6b",
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    👧 Mädchen
  </button>

  <button
    onClick={() => setGender("all")}
    style={{
      padding: "8px 14px",
      borderRadius: 10,
      border: "none",
      background: gender === "all" ? "#7ab6ff" : "#e1efff",
      color: gender === "all" ? "white" : "#1663a6",
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    ✨ Alle
  </button>
</div>


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
            <AppButton href={`/swipe-her?g=${gender}`} style={{ background: "#7ab6ff" }}>
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
