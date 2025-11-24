"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import BackButton from "../components/BackButton";
import AppButton from "../components/AppButton";
import { useRoleGuard } from "../hooks/useRoleGuard";

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const { loading: authLoading, allowed } = useRoleGuard();

  useEffect(() => {
    if (authLoading || !allowed) return;
    loadStats();
  }, [authLoading, allowed]);

  async function loadStats() {
    const [{ data: profileRows }, { data }] = await Promise.all([
      supabase.from("profiles").select("id, role"),
      supabase.from("decisions").select("user_id, decision"),
    ]);

    if (!data || !profileRows) return;

    const roleMap = profileRows.reduce((acc, row) => {
      const key = (row.role || "").toLowerCase();
      acc[key] = row.id;
      return acc;
    }, {});

    const papaId = roleMap.papa;
    const mamaId = roleMap.mama;

    const makeCount = (userId, type) =>
      data.filter(
        (d) => d.user_id === userId && d.decision === type
      ).length;

    setStats({
      papa: {
        like: makeCount(papaId, "like"),
        nope: makeCount(papaId, "nope"),
        maybe: makeCount(papaId, "maybe"),
      },
      mama: {
        like: makeCount(mamaId, "like"),
        nope: makeCount(mamaId, "nope"),
        maybe: makeCount(mamaId, "maybe"),
      },
    });
  }

  if (authLoading || !allowed) {
    return <AppBackground>Loading…</AppBackground>;
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
