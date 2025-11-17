"use client";

import { useState } from "react";
import { motion, useMotionValue, useAnimation } from "framer-motion";
import { namen as alleNamen } from "../../data/names";


export default function Page() {

  const [index, setIndex] = useState(0);
  const [likes, setLikes] = useState([]);

  const currentName = alleNamen[index];

  // Motion values
  const x = useMotionValue(0);
  const controls = useAnimation();

  function next() {
    setIndex((prev) => (prev + 1) % alleNamen.length);

    // Karte zurück in die Mitte setzen
    x.set(0);
    controls.set({ x: 0, rotate: 0, opacity: 1 });
  }

  async function like() {
    setLikes([...likes, currentName]);
    await controls.start({
      x: 300,
      rotate: 20,
      opacity: 0,
      transition: { duration: 0.3 },
    });
    next();
  }

  async function nope() {
    await controls.start({
      x: -300,
      rotate: -20,
      opacity: 0,
      transition: { duration: 0.3 },
    });
    next();
  }

  async function handleDragEnd(event, info) {
    const offsetX = info.offset.x;

    if (offsetX > 100) {
      like();
    } else if (offsetX < -100) {
      nope();
    } else {
      // zurück in die Mitte
      controls.start({ x: 0, rotate: 0, opacity: 1, transition: { duration: 0.2 } });
    }
  }

  return (
    <main
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        height: "80vh",
        justifyContent: "center",
      }}
    >
      <motion.div
        drag="x"
        style={{
          x,
          width: 250,
          height: 350,
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 32,
          fontWeight: "bold",
          userSelect: "none",
        }}
        animate={controls}
        onDragEnd={handleDragEnd}
      >
        {currentName}
      </motion.div>

      <div style={{ display: "flex", gap: 16 }}>
        <button onClick={nope} style={{ padding: "12px 20px" }}>
          Nope
        </button>
        <button onClick={like} style={{ padding: "12px 20px" }}>
          Like
        </button>
      </div>
    </main>
  );
}
