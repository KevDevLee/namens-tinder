"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ style = {} }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        padding: "8px 14px",
        background: "#dce9f8",
        color: "#1663a6",
        borderRadius: 10,
        border: "none",
        fontWeight: 600,
        boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
        ...style,
      }}
    >
      Zurück
    </button>
  );
}
