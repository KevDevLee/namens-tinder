"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Page() {
  const [names, setNames] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("names")
        .select("*")
        .order("name", { ascending: true })
        .range(0, 9000);  // <-- LIMITIERUNG HINZUGEFÜGT

      if (error) {
        setError(error.message);
      } else {
        setNames(data);
      }
    }

    load();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Supabase Test</h1>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <pre>{JSON.stringify(names, null, 2)}</pre>
    </main>
  );
}
