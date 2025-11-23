"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AppBackground from "../components/AppBackground";
import AppCard from "../components/AppCard";
import AppButton from "../components/AppButton";
import BackButton from "../components/BackButton";
import { motion } from "framer-motion";

export default function AddNamePage() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("m");
  const [status, setStatus] = useState("");

  async function handleAdd() {
    setStatus("");

    if (!name.trim()) {
      setStatus("❌ Bitte gib einen Namen ein.");
      return;
    }

    const cleanName = name.trim();

    // 1. Prüfen, ob Name bereits existiert
    const { data: existing, error: checkError } = await supabase
      .from("names")
      .select("id")
      .ilike("name", cleanName);

    if (checkError) {
      console.error("SELECT ERROR:", checkError);
      setStatus(`❌ Fehler bei der Prüfung: ${checkError.message}`);
      return;
    }

    if (existing && existing.length > 0) {
      setStatus("⚠️ Dieser Name existiert bereits in der Datenbank.");
      return;
    }

    // 2. Einfügen
    const { data: inserted, error: insertError } = await supabase
      .from("names")
      .insert({
        name: cleanName,
        gender: gender,
      })
      .select(); // WICHTIG für klare Fehlermeldungen

    if (insertError) {
      console.error("INSERT ERROR DETAILS:", insertError);
      setStatus(`❌ Fehler beim Einfügen: ${insertError.message}`);
      return;
    }

    // Namensmanager Reload triggern
    localStorage.setItem("reload-names", "true");

    setStatus(`✅ "${cleanName}" wurde erfolgreich hinzugefügt.`);
    setName("");
  }

  return (
    <AppBackground>
      <AppCard style={{ paddingBottom: 40, position: "relative" }}>
        
        {/* Zurück IMMER zum Namensmanager */}
        <BackButton href="/name-manager" />

        <h1
          style={{
            color: "#1663a6",
            fontSize: 28,
            marginBottom: 20,
            marginTop: 6,
            textAlign: "center",
          }}
        >
          Name hinzufügen
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Texteingabe */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name eingeben"
            style={{
              padding: "12px 16px",
              fontSize: 18,
              borderRadius: 12,
              border: "2px solid #cfe7ff",
              outline: "none",
              width: "100%",
            }}
          />

          {/* Gender Auswahl */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 20,
              justifyContent: "center",
            }}
          >
            {/* Junge */}
            <button
              onClick={() => setGender("m")}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "2px solid",
                borderColor: gender === "m" ? "#4a90e2" : "#cccccc",
                background: gender === "m" ? "#4a90e2" : "#f2f4f8",
                color: gender === "m" ? "white" : "#7b7b7b",
                fontSize: 16,
                fontWeight: 600,
                opacity: gender === "m" ? 1 : 0.45,
                transition: "0.25s",
              }}
            >
              👦 Junge
            </button>

            {/* Mädchen */}
            <button
              onClick={() => setGender("w")}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "2px solid",
                borderColor: gender === "w" ? "#ff97d1" : "#cccccc",
                background: gender === "w" ? "#ff97d1" : "#f2f4f8",
                color: gender === "w" ? "white" : "#7b7b7b",
                fontSize: 16,
                fontWeight: 600,
                opacity: gender === "w" ? 1 : 0.45,
                transition: "0.25s",
              }}
            >
              👧 Mädchen
            </button>
          </div>

          {/* Add Button */}
          <AppButton
            onClick={handleAdd}
            style={{ background: "#4cd964", marginTop: 10 }}
          >
            Hinzufügen
          </AppButton>

          {/* Status Text */}
          {status && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                color: "#1663a6",
                textAlign: "center",
                marginTop: 10,
                fontWeight: 600,
              }}
            >
              {status}
            </motion.p>
          )}
        </div>
      </AppCard>
    </AppBackground>
  );
}
