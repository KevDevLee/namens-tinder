"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion, useMotionValue, useAnimation } from "framer-motion";

export default function SwipeHerPage() {
  const [names, setNames] = useState([]);
  const [index, setIndex] = useState(0);
  const [herLikes, setHerLikes] = useState([]);

  const x = useMotionValue(0);
  const controls = useAnimation();

  const current = names[index];

  // Namen laden
  useEffect(() => {
    async function loadNames() {
      const { data, error } = await supabase
        .from("names")
        .select("*")
        .order("id");

      if (!error && data) setNames(data);
    }

    loadNames();
  }, []);

  // Ihre Likes laden
  useEffect(() => {
    async function loadLikes() {
      const { data, error } = await supabase
        .from("likes")
        .select("name_id")
        .eq("user", "her");

      if (!error && data) {
        setHerLikes(data.map((row) => row.name_id));
      }
    }

    loadLikes();
  }, []);

  function nextCard() {
    setIndex((prev) => (prev + 1) % names.length);
    x.set(0);
    controls.set({ x: 0, rotate: 0, opacity: 1 });
  }

  async function like() {
    if (!current) return;

    const { error: insertError } = await supabase
      .from("likes")
      .insert({
        user: "her",
        name_id: current.id,
      });

    if (insertError) {
      console.error("INSERT ERROR (her):", insertError);
    }

    setHerLikes((prev) => [...prev, current.id]);

    await controls.start({
      x: 300,
      rotate: 20,
      opacity: 0,
      transition: { duration: 0.3 },
    });

    nextCard();
  }

  async function nope() {
    await controls.start({
      x: -300,
      rotate: -20,
      opacity: 0,
      transition: { duration: 0.3 },
    });
    nextCard();
  }

  function handleDragEnd(_, info) {
    if (info.offset.x > 100) like();
    else if (info.offset.x < -100) nope();
    else {
      controls.start({
        x: 0,
        rotate: 0,
        opacity: 1,
        transition: { duration: 0.2 },
      });
    }
  }

  if (names.length === 0) return <p style={{ padding: 20 }}>Loading…</p>;

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
        animate={controls}
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
        onDragEnd={handleDragEnd}
      >
        {current?.name}
      </motion.div>

      <div style={{ display: "flex", gap: 16 }}>
        <button onClick={nope}>Nope</button>
        <button onClick={like}>Like</button>
      </div>

      <p style={{ marginTop: 20 }}>
        Ihre Likes (IDs): {herLikes.join(", ")}
      </p>
    </main>
  );
}
