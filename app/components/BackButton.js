import Link from "next/link";

export default function BackButton() {
  return (
<Link
  href="/"
  style={{
    position: "absolute",
    top: 12,
    left: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "white",
    textDecoration: "none",
    background: "#1663a6",
    borderRadius: 12,
    padding: "6px 12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  }}
>
  Zurück
</Link>
  );
}
