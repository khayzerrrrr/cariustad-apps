"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * StaggerShaf — pola signature CariUstadz: koleksi kartu "masuk shaf".
 * Setiap kartu meluncur naik dengan jarak (stagger) lalu menetap presisi
 * ke grid-nya, seperti jamaah melangkah ke barisan.
 * Hanya properti GPU. Reduced motion → tampil langsung tanpa animasi.
 */

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function StaggerShaf({
  children,
  className,
  itemClassName,
}: {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <div className={className}>
        {children.map((child, i) => (
          <div key={i} className={itemClassName}>
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children.map((child, i) => (
        <motion.div key={i} className={itemClassName} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
