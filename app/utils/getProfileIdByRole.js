import { supabase } from "../../lib/supabaseClient";

export async function getProfileIdByRole(role) {
  if (!role) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", role)
    .maybeSingle();

  if (error) {
    console.error("getProfileIdByRole error:", error);
    return null;
  }

  return data?.id ?? null;
}
