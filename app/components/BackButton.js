"use client";
import Link from "next/link";

export default function BackButton({ href = "/" }) {
  return (
    <Link
      href={href}
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        background: "#dbe9ff",
        padding: "8px 12px",
        borderRadius: 10,
        color: "#1663a6",
        textDecoration: "none",
        fontWeight: 600,
        fontSize: 14,
        boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
      }}
    >
      Zurück
    </Link>
  );
}
