"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";
import AppButton from "../components/AppButton";

export default function StatsPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { data } = await supabase
      .from("decisions")
      .select("user, decision");

    if (!data) return;

    const makeCount = (user, type) =>
      data.filter(
        (d) => d.user === user && d.decision === type
      ).length;

    setStats({
      papa: {
        like: makeCount("me", "like"),
        nope: makeCount("me", "nope"),
        maybe: makeCount("me", "maybe"),
      },
      mama: {
        like: makeCount("her", "like"),
        nope: makeCount("her", "nope"),
        maybe: makeCount("her", "maybe"),
      },
    });
  }

  if (!stats) {
    return <AppBackground>Loading…</AppBackground>;
  }

  return (
    <AppBackground>
      <AppCard
  style={{
    paddingBottom: 40,
    textAlign: "center",
    color: "#1663a6",
    fontWeight: 600,
    position: "relative",     // <-- HINZUGEFÜGT
  }}
>
  <BackButton />


        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#1663a6",
            marginBottom: 20,
          }}
        >
          Statistik
        </h1>

        {/* PAPA */}
        <h2 style={{ fontSize: 20, marginBottom: 8, color: "#1663a6" }}>
          Papa
        </h2>

        <p>Likes: {stats.papa.like}</p>
        <p>Nopes: {stats.papa.nope}</p>
        <p>Vielleicht: {stats.papa.maybe}</p>

        <div style={{ height: 20 }} />

        {/* MAMA */}
        <h2 style={{ fontSize: 20, marginBottom: 8, color: "#1663a6" }}>
          Mama
        </h2>

        <p>Likes: {stats.mama.like}</p>
        <p>Nopes: {stats.mama.nope}</p>
        <p>Vielleicht: {stats.mama.maybe}</p>

        <div style={{ height: 30 }} />

        <AppButton href="/stats-details">
          Details anzeigen
        </AppButton>
      </AppCard>
    </AppBackground>
  );
}
