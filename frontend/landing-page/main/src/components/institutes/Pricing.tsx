"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Users, Rocket, Building2 } from "lucide-react";
import { openLeadDialog } from "@/lib/leads";

type Plan = {
  name: string;
  icon: typeof Users;
  tagline: string;
  monthly: number | null; // per student / month
  annual: number | null; // per student / month, billed annually
  minNote: string;
  gradient: string;
  popular?: boolean;
  cta: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    icon: Users,
    tagline: "For solo tutors & small batches",
    monthly: 49,
    annual: 39,
    minNote: "Up to 100 students",
    gradient: "from-primary-500 to-primary-600",
    cta: "Start free trial",
    features: [
      "Your own subdomain & branding",
      "Notes, quizzes & mock tests",
      "Basic AI doubt solving*",
      "Student progress dashboards",
      "Email support",
    ],
  },
  {
    name: "Growth",
    icon: Rocket,
    tagline: "For growing coaching institutes",
    monthly: 99,
    annual: 79,
    minNote: "Up to 1,000 students",
    gradient: "from-primary-500 to-accent-500",
    popular: true,
    cta: "Book a demo",
    features: [
      "Everything in Starter, plus:",
      "Custom domain & white-label app",
      "Full AI tutor + auto-graded tests*",
      "Coding labs & assignments",
      "Gamified leaderboards",
      "Advanced analytics & reports",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    icon: Building2,
    tagline: "For large institutes, chains & colleges",
    monthly: null,
    annual: null,
    minNote: "Unlimited students",
    gradient: "from-accent-500 to-fuchsia-600",
    cta: "Get a quote",
    features: [
      "Everything in Growth, plus:",
      "Volume discounts at scale",
      "SSO & dedicated infrastructure",
      "Custom integrations & API access",
      "Onboarding & content migration",
      "Dedicated success manager & SLA",
    ],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-4">
            Simple, per-student pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
            Pay only for the students you{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">
              actually teach
            </span>
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400">
            No big upfront cost. Start small, scale as you grow — and unlock volume discounts as your batches expand.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <span className={`text-sm font-semibold ${!annual ? "text-surface-900 dark:text-white" : "text-surface-500"}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual((v) => !v)}
            aria-label="Toggle billing period"
            className="relative w-14 h-8 rounded-full bg-primary-600 transition-colors"
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
              style={{ left: annual ? "1.75rem" : "0.25rem" }}
            />
          </button>
          <span className={`text-sm font-semibold ${annual ? "text-surface-900 dark:text-white" : "text-surface-500"}`}>
            Annual
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 text-xs font-bold">
            Save 20%
          </span>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan, i) => {
            const price = annual ? plan.annual : plan.monthly;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`relative flex flex-col rounded-3xl p-8 border transition-all duration-300 ${
                  plan.popular
                    ? "bg-white dark:bg-surface-900 border-primary-300 dark:border-primary-700 shadow-glow-lg lg:scale-[1.04] z-10"
                    : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-sm hover:-translate-y-1"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold shadow-lg">
                      <Sparkles className="w-3.5 h-3.5" />
                      Most popular
                    </span>
                  </div>
                )}

                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-surface-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">{plan.tagline}</p>

                {/* Price */}
                <div className="mb-1 min-h-[3.25rem] flex items-end gap-1">
                  {price !== null ? (
                    <>
                      <span className="text-4xl font-display font-bold text-surface-900 dark:text-white">
                        ₹{price}
                      </span>
                      <span className="text-surface-500 dark:text-surface-400 text-sm mb-1.5">
                        / student / month
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-display font-bold text-surface-900 dark:text-white">
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-6">
                  {price !== null
                    ? `${annual ? "Billed annually" : "Billed monthly"} · ${plan.minNote}`
                    : plan.minNote}
                </p>

                <button
                  onClick={() => openLeadDialog(plan.name === "Enterprise" ? "contact" : "demo")}
                  className={`w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 mb-8 ${
                    plan.popular
                      ? "bg-primary-600 hover:bg-primary-700 text-white shadow-glow"
                      : "bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-900 dark:text-white"
                  }`}
                >
                  {plan.cta}
                </button>

                <ul className="space-y-3 text-sm">
                  {plan.features.map((f) => {
                    const isHeader = f.endsWith("plus:");
                    return (
                      <li
                        key={f}
                        className={`flex items-start gap-2.5 ${
                          isHeader
                            ? "text-surface-500 dark:text-surface-400 font-semibold"
                            : "text-surface-700 dark:text-surface-300"
                        }`}
                      >
                        {!isHeader && (
                          <Check className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                        )}
                        <span className={isHeader ? "pt-1" : ""}>{f}</span>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Reassurance strip */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-surface-500 dark:text-surface-400">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success-500" /> 14-day free trial
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success-500" /> No credit card to start
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success-500" /> Cancel anytime
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success-500" /> Volume discounts for 1,000+ students
          </span>
        </div>

        {/* AI pricing footnote */}
        <div className="mt-8 max-w-3xl mx-auto rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-6 py-5">
          <p className="flex items-start gap-2.5 text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
            <Sparkles className="w-4 h-4 text-accent-500 mt-0.5 shrink-0" />
            <span>
              <span className="font-bold text-surface-900 dark:text-white">*AI features are billed separately.</span>{" "}
              AI-powered doubt solving, the 24/7 AI tutor and auto-evaluation run on
              pay-as-you-go usage credits, so you only pay for what your students actually use.
              Generous free credits are included with every plan — talk to us for detailed AI
              usage pricing and volume packs.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
