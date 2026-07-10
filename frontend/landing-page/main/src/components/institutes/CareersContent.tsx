"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  X,
  CheckCircle2,
  Loader2,
  Briefcase,
  MapPin,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";
import { jobOpenings, type JobOpening } from "./careersData";
import { submitJobApplication } from "@/lib/leads";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";
const labelClass =
  "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";

function JobCard({
  job,
  onApply,
}: {
  job: JobOpening;
  onApply: (job: JobOpening) => void;
}) {
  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 sm:p-8 shadow-sm hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-full">
            <Layers className="w-3.5 h-3.5" /> {job.team}
          </span>
          <h3 className="mt-3 text-xl font-display font-bold text-surface-900 dark:text-white">
            {job.title}
          </h3>
        </div>
        <button
          onClick={() => onApply(job)}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-glow transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          Apply now
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-surface-500 dark:text-surface-400">
        <span className="inline-flex items-center gap-1.5">
          <Briefcase className="w-4 h-4" /> {job.type}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="w-4 h-4" /> {job.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-4 h-4" /> {job.experience}
        </span>
      </div>

      <p className="mt-4 text-surface-600 dark:text-surface-300 leading-relaxed">
        {job.summary}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-2">
            What you&apos;ll do
          </h4>
          <ul className="space-y-1.5 text-sm text-surface-600 dark:text-surface-400 list-disc list-inside">
            {job.responsibilities.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-2">
            What we&apos;re looking for
          </h4>
          <ul className="space-y-1.5 text-sm text-surface-600 dark:text-surface-400 list-disc list-inside">
            {job.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CareersContent() {
  const [activeJob, setActiveJob] = useState<JobOpening | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const close = useCallback(() => {
    setActiveJob(null);
    setStatus("idle");
    setErrorMsg("");
  }, []);

  const openApply = useCallback((job: JobOpening) => {
    setStatus("idle");
    setErrorMsg("");
    setActiveJob(job);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    if (activeJob) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [activeJob, close]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeJob) return;
    const form = e.currentTarget;
    const data = Object.fromEntries(
      new FormData(form).entries()
    ) as Record<string, string>;
    setStatus("submitting");
    setErrorMsg("");

    try {
      await submitJobApplication({
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: activeJob.title,
        experience: data.experience,
        portfolio_url: data.portfolio_url,
        cover_letter: data.cover_letter,
        source: `careers-${activeJob.id}`,
      });
      setStatus("success");
      form.reset();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const frontend = jobOpenings.filter((j) => j.team === "Frontend");
  const backend = jobOpenings.filter((j) => j.team === "Backend");

  return (
    <main className="flex-1 bg-white dark:bg-surface-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:gap-3 transition-all mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">
          <Sparkles className="w-4 h-4" /> We&apos;re hiring
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-surface-900 dark:text-white">
          Build the future of EdTech with us
        </h1>
        <p className="mt-4 text-lg text-surface-600 dark:text-surface-300 leading-relaxed max-w-2xl">
          At DailyTaiyari we help coaching institutes, schools and colleges go
          digital on their own domain. Join a small, high-ownership team shipping
          products that reach thousands of students across India.
        </p>

        <section className="mt-14">
          <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-white mb-6">
            Frontend
          </h2>
          <div className="space-y-6">
            {frontend.map((job) => (
              <JobCard key={job.id} job={job} onApply={openApply} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-white mb-6">
            Backend (Django)
          </h2>
          <div className="space-y-6">
            {backend.map((job) => (
              <JobCard key={job.id} job={job} onApply={openApply} />
            ))}
          </div>
        </section>

        <div className="mt-16 pt-8 border-t border-surface-200 dark:border-surface-800 text-sm text-surface-500 dark:text-surface-400">
          Don&apos;t see a role that fits? Email us at{" "}
          <a
            href="mailto:careers@dailytaiyari.in"
            className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
          >
            careers@dailytaiyari.in
          </a>
          .
        </div>
      </div>

      <AnimatePresence>
        {activeJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-surface-900 shadow-2xl border border-surface-200 dark:border-surface-800"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={close}
                aria-label="Close"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 sm:p-8">
                {status === "success" ? (
                  <div className="text-center py-6">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-surface-900 dark:text-white mb-2">
                      Application received!
                    </h3>
                    <p className="text-surface-600 dark:text-surface-400 mb-6">
                      Thanks for applying to the {activeJob.title} role. Our team
                      will review your application and get back to you shortly.
                    </p>
                    <button
                      onClick={close}
                      className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                        Apply
                      </h3>
                    </div>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 ml-[3.25rem]">
                      Applying for{" "}
                      <span className="font-semibold text-surface-700 dark:text-surface-200">
                        {activeJob.title}
                      </span>
                    </p>

                    <form onSubmit={onSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass} htmlFor="job-name">
                            Name *
                          </label>
                          <input
                            id="job-name"
                            name="name"
                            required
                            minLength={2}
                            className={inputClass}
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="job-email">
                            Email *
                          </label>
                          <input
                            id="job-email"
                            name="email"
                            type="email"
                            required
                            className={inputClass}
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass} htmlFor="job-phone">
                            Phone
                          </label>
                          <input
                            id="job-phone"
                            name="phone"
                            className={inputClass}
                            placeholder="+91 "
                          />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="job-exp">
                            Years of experience
                          </label>
                          <input
                            id="job-exp"
                            name="experience"
                            className={inputClass}
                            placeholder="e.g. 3 years"
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="job-portfolio">
                          Portfolio / LinkedIn / GitHub
                        </label>
                        <input
                          id="job-portfolio"
                          name="portfolio_url"
                          type="url"
                          className={inputClass}
                          placeholder="https://"
                        />
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="job-cover">
                          Why you&apos;d be a great fit
                        </label>
                        <textarea
                          id="job-cover"
                          name="cover_letter"
                          rows={4}
                          className={inputClass}
                          placeholder="Tell us about yourself and why you're excited about this role."
                        />
                      </div>

                      {status === "error" && (
                        <p className="text-sm text-error-600 dark:text-error-400">
                          {errorMsg}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={status === "submitting"}
                        className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-70 text-white rounded-xl font-bold shadow-glow transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                      >
                        {status === "submitting" ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Sending…
                          </>
                        ) : (
                          "Submit application"
                        )}
                      </button>
                      <p className="text-xs text-center text-surface-400">
                        We&apos;ll never share your details. No spam.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
