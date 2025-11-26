"use client";

import Link from "next/link";

export default function HomeButton({ style = {} }) {
  return (
    <Link
      href="/"
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        padding: "8px 14px",
        background: "#1663a6",
        color: "white",
        borderRadius: 10,
        fontWeight: 600,
        textDecoration: "none",
        boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
        ...style,
      }}
    >
      Home
    </Link>
  );
}
