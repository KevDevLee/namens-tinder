"use client";

import { motion } from "framer-motion";
import AppBackground from "./components/AppBackground";
import AppCard from "./components/AppCard";
import AppButton from "./components/AppButton";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSessionContext } from "./providers/SupabaseSessionProvider";
import { getProfileIdByRole } from "./utils/getProfileIdByRole";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 16,
  borderRadius: 12,
  border: "1px solid #aac7e8",
  outline: "none",
  textAlign: "center",
};

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [gender, setGender] = useState("all");
  const [lastName, setLastName] = useState("Lee");
  const { session, role, loading, signOut } = useSessionContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [matchesCount, setMatchesCount] = useState(null);

  // Hydration-Fix → verhindert SSR-Fehler
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Load gender + lastName from localStorage (nur im Browser)
  useEffect(() => {
    if (!hydrated) return;

    const storedGender = localStorage.getItem("genderFilter");
    if (storedGender) setGender(storedGender);

    const storedLastName = localStorage.getItem("babyLastName");
    if (storedLastName) setLastName(storedLastName);
  }, [hydrated]);

  // Save gender
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("genderFilter", gender);
  }, [gender, hydrated]);

  // Save last name
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("babyLastName", lastName);
  }, [lastName, hydrated]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setAuthError("");
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err) {
      setAuthError(err.message ?? "Unbekannter Fehler");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!session?.user?.id || !role) {
      setMatchesCount(null);
      return;
    }

    async function loadMatchesCount() {
      try {
        const otherRole = role === "papa" ? "mama" : "papa";
        const otherUserId = await getProfileIdByRole(otherRole);
        if (!otherUserId) {
          setMatchesCount(0);
          return;
        }

        const [{ data: myLikes }, { data: otherLikes }] = await Promise.all([
          supabase
            .from("decisions")
            .select("name_id")
            .eq("user_id", session.user.id)
            .eq("decision", "like"),
          supabase
            .from("decisions")
            .select("name_id")
            .eq("user_id", otherUserId)
            .eq("decision", "like"),
        ]);

        const myIds = new Set((myLikes || []).map((row) => row.name_id));
        const shared = (otherLikes || [])
          .map((row) => row.name_id)
          .filter((id) => myIds.has(id));

        setMatchesCount(shared.length);
      } catch (err) {
        console.error("loadMatchesCount error:", err);
        setMatchesCount(0);
      }
    }

    loadMatchesCount();
  }, [session?.user?.id, role]);

  // verhindert SSR mismatch
  if (!hydrated || loading) {
    return <AppBackground>Loading…</AppBackground>;
  }

  const styleButton = (activeColor, inactiveColor, active) => ({
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    fontSize: 16,
    fontWeight: 600,
    background: active ? activeColor : inactiveColor,
    color: active ? "white" : "#1663a6",
    opacity: active ? 1 : 0.6,
    transition: "0.25s ease",
    boxShadow: active ? `0 0 14px ${activeColor}aa` : "none",
  });

  if (!session) {
    return (
      <AppBackground>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <AppCard style={{ gap: 16 }}>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: "#1663a6",
              }}
            >
              Willkommen zurück!
            </motion.h1>

            <form
              onSubmit={handleAuthSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: "100%",
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail"
                style={inputStyle}
              />

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort"
                style={inputStyle}
              />

              {authError && (
                <p style={{ color: "#d7263d", fontSize: 14 }}>{authError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                  background: "#4a90e2",
                  color: "white",
                  fontWeight: 700,
                }}
              >
                {submitting ? "Bitte warten…" : "Einloggen"}
              </button>
            </form>
          </AppCard>
        </motion.div>
      </AppBackground>
    );
  }

  const roleLabel = role === "papa" ? "Papa" : "Mama";

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
              fontSize: 28,
              fontWeight: "800",
              color: "#1663a6",
              marginBottom: 12,
            }}
          >
            Hallo {roleLabel}! 👋
          </motion.h1>

          <p style={{ color: "#4a4a4a", marginBottom: 12 }}>
            Genderfilter & Nachname gelten für beide Elternteile auf diesem
            Gerät.
          </p>

          {/* Nachname Eingabe */}
          <div style={{ marginBottom: 20, width: "100%" }}>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nachname des Babys…"
              style={inputStyle}
            />
          </div>

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
              style={styleButton("#4a90e2", "#dbe9ff", gender === "m")}
            >
              👦 Junge
            </button>

            <button
              onClick={() => setGender("w")}
              style={styleButton("#ff97d1", "#ffe4f4", gender === "w")}
            >
              👧 Mädchen
            </button>

            <button
              onClick={() => setGender("all")}
              style={styleButton("#7ab6ff", "#e1efff", gender === "all")}
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
            {role === "papa" ? (
              <AppButton href={`/swipe-me?g=${gender}`}>
                Papa Swipe starten
              </AppButton>
            ) : (
              <AppButton
                href={`/swipe-her?g=${gender}`}
                style={{ background: "#7ab6ff" }}
              >
                Mama Swipe starten
              </AppButton>
            )}

            <AppButton
              href="/my-decisions"
              style={{
                background: "#7ab6ff",
                color: "#ffffff",
                fontSize: 21,
              }}
            >
              Meine Likes
            </AppButton>

            <AppButton
              href="/matches"
              style={{
                background: "#cfe7ff",
                color: "#1663a6",
                marginTop: 10,
              }}
            >
              Matches{matchesCount !== null ? ` (${matchesCount})` : ""}
            </AppButton>

            <AppButton
              href="/name-manager"
              style={{
                background: "#ffffffaa",
                color: "#1663a6",
                fontSize: 16,
                padding: "10px 14px",
                marginTop: 6,
              }}
            >
              Namensmanager
            </AppButton>
          </motion.div>

          <button
            onClick={signOut}
            style={{
              marginTop: 24,
              background: "none",
              border: "none",
              color: "#d7263d",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Logout
          </button>
        </AppCard>
      </motion.div>
    </AppBackground>
  );
}
