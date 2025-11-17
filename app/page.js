"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(180deg, #3a8de0 0%, #6fbaff 100%)",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{
          background: "white",
          width: "100%",
          maxWidth: 380,
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Titel */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: "#1663a6",
            marginBottom: 6,
          }}
        >
          Swipe. Match. Name.
        </motion.h1>

        {/* Untertitel */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          style={{
            fontSize: 16,
            color: "#4a4a4a",
            maxWidth: 270,
            marginBottom: 28,
            lineHeight: "1.4",
          }}
        >
          Findet gemeinsam euren perfekten Babynamen.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 16,
          }}
        >
          <Link
            href="/swipe-me"
            style={{
              background: "#4a90e2",
              color: "white",
              fontSize: 20,
              padding: "14px 18px",
              borderRadius: 12,
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "600",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            }}
          >
            Papa Swipe
          </Link>

          <Link
            href="/swipe-her"
            style={{
              background: "#7ab6ff",
              color: "white",
              fontSize: 20,
              padding: "14px 18px",
              borderRadius: 12,
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "600",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            }}
          >
            Mama Swipe
          </Link>

          <Link
            href="/matches"
            style={{
              background: "#cfe7ff",
              color: "#1663a6",
              fontSize: 20,
              padding: "14px 18px",
              borderRadius: 12,
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "600",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              marginTop: 10,
            }}
          >
            Matches
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
