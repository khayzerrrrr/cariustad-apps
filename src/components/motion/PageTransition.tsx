"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * PageTransition — dipasang via app/template.tsx.
 * Transisi halaman tenang: fade + naik tipis, ease-transition 300ms.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.65, 0, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}
