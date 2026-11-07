"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * WordReveal — headline display dengan stagger per kata.
 * Wajib dipakai untuk teks display >48px (hard stop: descender safety —
 * overflow selalu visible + padding-bottom 0.18em via .display-safe).
 */
export default function WordReveal({
  text,
  className,
  highlightClass,
  highlightWords = [],
  delay = 0,
}: {
  text: string;
  className?: string;
  /** class untuk kata yang di-highlight (mis. warna emas) */
  highlightClass?: string;
  /** kata-kata (case-insensitive) yang mendapat highlightClass */
  highlightWords?: string[];
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  if (reduced) {
    return (
      <span className={`display-safe ${className ?? ""}`}>
        {words.map((w, i) => {
          const hl = highlightWords.some(
            (h) => w.toLowerCase().includes(h.toLowerCase())
          );
          return (
            <span key={i} className={hl ? highlightClass : undefined}>
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span className={`display-safe inline-block ${className ?? ""}`}>
      {words.map((w, i) => {
        const hl = highlightWords.some((h) =>
          w.toLowerCase().includes(h.toLowerCase())
        );
        return (
          <motion.span
            key={i}
            className={`inline-block ${hl ? highlightClass ?? "" : ""}`}
            initial={{ opacity: 0, y: "0.6em" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        );
      })}
    </span>
  );
}
