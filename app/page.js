"use client";

import { motion } from "framer-motion";
import AppBackground from "./components/AppBackground";
import AppCard from "./components/AppCard";
import AppButton from "./components/AppButton";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSessionContext } from "./providers/SupabaseSessionProvider";

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

  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("papa");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    setAuthMessage("");
    setSubmitting(true);

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: selectedRole },
          },
        });
        if (error) throw error;

        if (data.user) {
          // Persist role mapping in profiles table for lookups
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({ id: data.user.id, role: selectedRole });
          if (profileError) throw profileError;
        }

        setAuthMessage(
          "Registrierung erfolgreich! Du bist jetzt angemeldet."
        );
      }
    } catch (err) {
      setAuthError(err.message ?? "Unbekannter Fehler");
    } finally {
      setSubmitting(false);
    }
  }

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

              {authMode === "register" && (
                <div style={{ display: "flex", gap: 12 }}>
                  <label
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    <input
                      type="radio"
                      value="papa"
                      checked={selectedRole === "papa"}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    />
                    Papa
                  </label>
                  <label
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    <input
                      type="radio"
                      value="mama"
                      checked={selectedRole === "mama"}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    />
                    Mama
                  </label>
                </div>
              )}

              {authError && (
                <p style={{ color: "#d7263d", fontSize: 14 }}>{authError}</p>
              )}

              {authMessage && (
                <p style={{ color: "#0f9d58", fontSize: 14 }}>
                  {authMessage}
                </p>
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
                {submitting
                  ? "Bitte warten…"
                  : authMode === "login"
                  ? "Einloggen"
                  : "Registrieren"}
              </button>
            </form>

            <button
              onClick={() =>
                setAuthMode((prev) => (prev === "login" ? "register" : "login"))
              }
              style={{
                background: "none",
                border: "none",
                color: "#1663a6",
                fontSize: 14,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {authMode === "login"
                ? "Neu hier? Jetzt registrieren."
                : "Schon ein Konto? Hier einloggen."}
            </button>
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
                background: "#ffffff",
                color: "#1663a6",
                fontSize: 16,
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
              Matches
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
              🔧 Namensmanager
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
