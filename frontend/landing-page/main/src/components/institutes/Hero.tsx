"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe, Sparkles, LayoutDashboard, Trophy, BookOpen, LineChart, Smartphone } from "lucide-react";
import Typewriter from "./Typewriter";
import { openLeadDialog } from "@/lib/leads";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-surface-50 dark:bg-surface-950 pt-20 pb-28">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20">
        <div className="absolute top-0 -left-20 w-[28rem] h-[28rem] bg-primary-400 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-accent-400 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>White-label learning platform for institutes</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.1] text-surface-900 dark:text-white"
            >
              Take your institute{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">
                online &amp; fully digital
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-2xl sm:text-3xl font-display font-semibold text-surface-800 dark:text-surface-100 min-h-[2.5rem]"
            >
              Get a website for your{" "}
              <Typewriter
                words={["Coaching", "School", "College", "Academy", "Test Series", "Institute"]}
                className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-lg lg:text-xl text-surface-600 dark:text-surface-400 max-w-2xl"
            >
              Launch your own branded exam-prep portal — on your own domain. Run live classes,
              publish notes and question banks, conduct quizzes and full mock tests, build a
              student community, and track every student&apos;s performance and skills in real time.
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
              <Link
                href="#features"
                className="px-8 py-4 bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 hover:border-primary-500 text-surface-900 dark:text-white rounded-xl font-bold text-lg transition-all hover:scale-105 text-center"
              >
                Explore Features
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3"
            >
              <span className="text-surface-500 dark:text-surface-400 font-medium flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary-500" />
                Built for coaching institutes, schools &amp; colleges
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-sm font-semibold">
                <Smartphone className="w-3.5 h-3.5" />
                Mobile app coming soon
              </span>
            </motion.p>
          </div>

          {/* Portal mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
              {/* Browser chrome with the institute's own domain */}
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                <span className="w-3 h-3 rounded-full bg-error-400" />
                <span className="w-3 h-3 rounded-full bg-warning-400" />
                <span className="w-3 h-3 rounded-full bg-success-400" />
                <div className="ml-3 flex-1 h-6 rounded-md bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 flex items-center px-3">
                  <span className="text-[11px] text-surface-500 font-mono truncate">
                    learn.your-institute.com
                  </span>
                </div>
              </div>

              {/* Dashboard body */}
              <div className="flex">
                <div className="hidden sm:flex flex-col gap-3 w-16 p-3 bg-surface-50 dark:bg-surface-950 border-r border-surface-200 dark:border-surface-800">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500" />
                  {[LayoutDashboard, BookOpen, LineChart, Trophy].map((Icon, i) => (
                    <div key={i} className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400">
                      <Icon className="w-4 h-4" />
                    </div>
                  ))}
                </div>

                <div className="flex-1 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded bg-surface-200 dark:bg-surface-700" />
                    <div className="h-7 w-20 rounded-lg bg-primary-100 dark:bg-primary-900/40" />
                  </div>

                  {/* metric cards (qualitative, no numbers) */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Performance", c: "from-primary-500 to-primary-600" },
                      { label: "Skill mastery", c: "from-accent-500 to-accent-600" },
                      { label: "Engagement", c: "from-success-500 to-success-600" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.c} mb-2`} />
                        <div className="text-[10px] text-surface-500 font-medium">{m.label}</div>
                        <div className="mt-2 h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: ["55%", "80%", "68%"][["Performance", "Skill mastery", "Engagement"].indexOf(m.label)] }}
                            transition={{ duration: 1.2, delay: 0.6 }}
                            className={`h-full rounded-full bg-gradient-to-r ${m.c}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* chart placeholder */}
                  <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-4">
                    <div className="h-3 w-24 rounded bg-surface-200 dark:bg-surface-700 mb-3" />
                    <div className="flex items-end gap-2 h-24">
                      {[40, 65, 50, 80, 60, 90, 72].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.06 }}
                          className="flex-1 rounded-t-md bg-gradient-to-t from-primary-500/80 to-accent-500/80"
                        />
                      ))}
                    </div>
                  </div>
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
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-surface-900 dark:text-white text-sm">Your domain</p>
                <p className="text-surface-500 text-xs">Your branding</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-5 -right-4 sm:-right-8 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-xl flex items-center justify-center">
                <LineChart className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-surface-900 dark:text-white text-sm">Real-time</p>
                <p className="text-surface-500 text-xs">Performance tracking</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
