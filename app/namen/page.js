"use client";

import { useState } from "react";
import { namen as initialNamen } from "../../data/names";

export default function Page() {
  const [namen, setNamen] = useState([...initialNamen]);
  const [input, setInput] = useState("");

  function addName() {
    const neuerName = input.trim();
    if (!neuerName) return;

    // ignorieren, wenn Name bereits existiert
    if (namen.includes(neuerName)) return;

    const updated = [...namen, neuerName];
    setNamen(updated);

    // später speichern wir updated in eine Datei / DB!
    console.warn("Name hinzugefügt – aber noch NICHT gespeichert:", updated);

    setInput("");
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Namen</h1>

      <p>Neue Namen hinzufügen:</p>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Neuer Name"
        style={{ padding: 8, marginRight: 8 }}
      />

      <button onClick={addName} style={{ padding: "8px 12px" }}>
        Hinzufügen
      </button>

      <hr style={{ margin: "20px 0" }} />

      <ul>
        {namen.map((name) => (
          <li key={name} style={{ marginBottom: 8 }}>
            {name}
          </li>
        ))}
      </ul>
    </main>
  );
}
