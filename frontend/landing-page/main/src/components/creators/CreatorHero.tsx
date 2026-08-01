"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  BadgeCheck,
  Wallet,
  Play,
} from "lucide-react";
import { Youtube, Instagram, Linkedin, Telegram } from "./BrandIcons";
import Typewriter from "../institutes/Typewriter";
import { openLeadDialog } from "@/lib/leads";

export default function CreatorHero() {
  return (
    <section className="relative overflow-hidden bg-surface-50 dark:bg-surface-950 pt-16 pb-24">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25">
        <div className="absolute -top-10 -left-24 w-[30rem] h-[30rem] bg-primary-400 rounded-full blur-[130px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-accent-400 rounded-full blur-[130px] animate-pulse-slow" />
        <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-success-400 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Best for Creators &amp; Coaching Institutes</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.08] text-surface-900 dark:text-white"
            >
              Sell your knowledge online —{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">
                on your own branded website
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="text-lg sm:text-xl font-semibold text-primary-600 dark:text-primary-400"
            >
              Start your online learning portal in minutes — with us.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-2xl sm:text-3xl font-display font-semibold text-surface-800 dark:text-surface-100 min-h-[2.5rem]"
            >
              Built for{" "}
              <Typewriter
                words={[
                  "Online Creators",
                  "Coaching Institutes",
                  "Schools & Colleges",
                ]}
                className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-lg lg:text-xl text-surface-600 dark:text-surface-400 max-w-2xl"
            >
              Turn your audience into income. Launch structured courses, test series and
              live cohorts on your own domain — with AI-assisted course &amp; content creation,
              an AI doubt-solving tutor, payments, certificates and analytics built in. No
              code, no middleman.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <button
                onClick={() => openLeadDialog("demo")}
                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-glow transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                Book a Demo <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => openLeadDialog("contact")}
                className="px-8 py-4 bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 hover:border-primary-500 text-surface-900 dark:text-white rounded-xl font-bold text-lg transition-all hover:scale-105 text-center flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" /> Start Selling
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 pt-1 text-sm text-surface-500 dark:text-surface-400 font-medium"
            >
              <span className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-success-500" /> Your brand, your domain
              </span>
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary-500" /> Keep your earnings
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-500" /> AI tutor included
              </span>
            </motion.div>
          </div>

          {/* Branded creator site mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
              {/* Browser chrome with the creator's own domain */}
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                <span className="w-3 h-3 rounded-full bg-error-400" />
                <span className="w-3 h-3 rounded-full bg-warning-400" />
                <span className="w-3 h-3 rounded-full bg-success-400" />
                <div className="ml-3 flex-1 h-6 rounded-md bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 flex items-center px-3">
                  <span className="text-[11px] text-surface-500 font-mono truncate">
                    learn.yourbrand.com
                  </span>
                </div>
              </div>

              {/* Creator storefront body */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500" />
                    <div>
                      <div className="h-2.5 w-24 rounded bg-surface-200 dark:bg-surface-700" />
                      <div className="mt-1 h-2 w-16 rounded bg-surface-100 dark:bg-surface-800" />
                    </div>
                  </div>
                  <div className="h-7 w-16 rounded-lg bg-primary-100 dark:bg-primary-900/40" />
                </div>

                {/* Featured course card */}
                <div className="rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
                  <div className="h-20 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 [background-size:200%_200%] animate-gradient" />
                  <div className="p-3">
                    <div className="h-2.5 w-32 rounded bg-surface-200 dark:bg-surface-700" />
                    <div className="mt-2 flex items-center justify-between">
                      <div className="h-2 w-20 rounded bg-surface-100 dark:bg-surface-800" />
                      <div className="text-[11px] font-bold text-success-600 dark:text-success-400">
                        ₹2,999
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "from-primary-500 to-primary-600",
                    "from-accent-500 to-accent-600",
                    "from-success-500 to-success-600",
                    "from-warning-500 to-accent-600",
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-surface-200 dark:border-surface-800 p-2"
                    >
                      <div className={`h-10 rounded-lg bg-gradient-to-br ${c} mb-2`} />
                      <div className="h-2 w-full rounded bg-surface-200 dark:bg-surface-700" />
                      <div className="mt-1 h-2 w-2/3 rounded bg-surface-100 dark:bg-surface-800" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-5 -left-4 sm:-left-8 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-surface-900 dark:text-white text-sm">New sale</p>
                <p className="text-surface-500 text-xs">₹2,999 · just now</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-5 -right-4 sm:-right-8 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700 flex items-center gap-2"
            >
              {[Youtube, Instagram, Linkedin, Telegram].map((Icon, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-primary-600 dark:text-primary-400"
                >
                  <Icon className="w-4 h-4" />
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
