// app/utils/fetchAllNames.js
import { supabase } from "../../lib/supabaseClient";

/**
 * Holt ALLE Namen in Batches (um das 1000-Row-Limit von Supabase zu umgehen).
 * Optional mit genderFilter ("m", "w", "all").
 */
export async function fetchAllNames(genderFilter = "all") {
  const pageSize = 1000;
  let all = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;

    let query = supabase
      .from("names")
      .select("*")
      .order("name", { ascending: true })
      .range(from, to);

    if (genderFilter !== "all") {
      query = query.eq("gender", genderFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("fetchAllNames error:", error);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    all = all.concat(data);

    // Wenn weniger als pageSize zurückkamen → wir sind am Ende
    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return all;
}
