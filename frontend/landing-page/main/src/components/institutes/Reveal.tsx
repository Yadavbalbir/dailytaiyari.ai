"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const variants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** stagger index for sequential reveals */
  index?: number;
};

/** Fades + lifts its children into view once, on scroll. */
export default function Reveal({ children, className, index = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}
