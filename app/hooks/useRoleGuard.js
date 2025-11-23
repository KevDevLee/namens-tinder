"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSessionContext } from "../providers/SupabaseSessionProvider";

export function useRoleGuard(requiredRole) {
  const router = useRouter();
  const { session, role, loading } = useSessionContext();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/");
      return;
    }

    if (requiredRole && role !== requiredRole) {
      router.replace("/");
    }
  }, [session, role, loading, requiredRole, router]);

  return {
    session,
    role,
    user: session?.user ?? null,
    loading,
    allowed: Boolean(session && (!requiredRole || role === requiredRole)),
  };
}
