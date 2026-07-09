"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, GraduationCap } from "lucide-react";

const links = [
  { name: "Who it's for", href: "#audience" },
  { name: "See it", href: "#tour" },
  { name: "Features", href: "#features" },
  { name: "How it works", href: "#how" },
  { name: "Grow", href: "#grow" },
  { name: "FAQ", href: "#faq" },
];

export default function InstituteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-lg border-b border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">dt</span>
            </div>
            <span className="font-display font-bold text-xl hidden sm:block">
              DailyTaiyari <span className="text-primary-600 dark:text-primary-400">for Institutes</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.name}
                href={l.href}
                className="text-surface-600 hover:text-primary-600 dark:text-surface-300 dark:hover:text-primary-400 font-medium transition-colors"
              >
                {l.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="#demo"
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-glow transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" /> Book a Demo
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="flex md:hidden p-2 rounded-md text-surface-600 hover:text-primary-600 dark:text-surface-300"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white/95 dark:bg-surface-900/95 border-b border-surface-200 dark:border-surface-800"
          >
            <div className="px-4 py-4 space-y-2">
              {links.map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-2 py-2 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                >
                  {l.name}
                </Link>
              ))}
              <div className="pt-3 flex flex-col gap-3">
                <Link href="#demo" onClick={() => setOpen(false)} className="w-full px-4 py-2 bg-primary-600 text-white rounded-xl text-center font-semibold">
                  Book a Demo
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
