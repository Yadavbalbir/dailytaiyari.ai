"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Can we run it on our own domain with our own branding?",
    a: "Yes. DailyTaiyari is fully white-label. Your portal runs on your own web address with your logo and colors — students experience it as your institute's own platform.",
  },
  {
    q: "Do we need a technical team to get started?",
    a: "No. We handle the setup and hosting for you. You focus on your content and students; there are no servers to manage and nothing to install.",
  },
  {
    q: "Can we upload our own notes and questions?",
    a: "Absolutely. You can author your own notes, formula sheets and question banks, or start quickly with a ready-made content structure and customize from there.",
  },
  {
    q: "Which exams and subjects are supported?",
    a: "Any of them. The platform is fully configurable across subjects, chapters and topics — from school class tests to competitive exams like JEE and NEET.",
  },
  {
    q: "Can we manage multiple batches and teachers?",
    a: "Yes. Create multiple exams and batches, and give admins, instructors and students their own roles and access so your whole team works in one place.",
  },
  {
    q: "How do students and teachers track progress?",
    a: "Through real-time dashboards. Everyone sees performance, topic-wise strengths, skill mastery and engagement as students attempt quizzes and mock tests.",
  },
  {
    q: "Is it mobile friendly?",
    a: "Yes. The portal is fully responsive and works smoothly on phones, tablets and desktops — no app download required.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900 dark:text-white">
            Questions, answered
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className="rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-6 py-5"
                >
                  <span className="font-semibold text-surface-900 dark:text-white">{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="flex-shrink-0 text-primary-600 dark:text-primary-400">
                    <Plus className="w-5 h-5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-surface-600 dark:text-surface-400 leading-relaxed">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
