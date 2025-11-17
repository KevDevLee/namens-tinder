"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function MatchesPage() {
  const [myLikes, setMyLikes] = useState([]);
  const [herLikes, setHerLikes] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    async function load() {
      // 1. Deine Likes inkl. Name laden
      const { data: myData, error: myError } = await supabase
        .from("likes")
        .select("name_id, names(name)")
        .eq("user", "me");

      // 2. Ihre Likes inkl. Name laden
      const { data: herData, error: herError } = await supabase
        .from("likes")
        .select("name_id, names(name)")
        .eq("user", "her");

      if (!myError && !herError) {
        setMyLikes(myData);
        setHerLikes(herData);

        // IDs extrahieren
        const myIds = myData.map((r) => r.name_id);
        const herIds = herData.map((r) => r.name_id);

        // Schnittmenge berechnen
        const shared = myData
          .filter((r) => herIds.includes(r.name_id))
          .map((r) => r.names.name);

        setMatches(shared);
      }
    }

    load();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Matches</h1>

      {matches.length === 0 ? (
        <p>Noch keine gemeinsamen Likes.</p>
      ) : (
        <ul>
          {matches.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}

      <hr />

      <h3>Deine Likes</h3>
      <ul>
        {myLikes.map((r) => (
          <li key={r.name_id}>{r.names.name}</li>
        ))}
      </ul>

      <h3>Ihre Likes</h3>
      <ul>
        {herLikes.map((r) => (
          <li key={r.name_id}>{r.names.name}</li>
        ))}
      </ul>
    </main>
  );
}
