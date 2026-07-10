"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  X,
  CheckCircle2,
  Loader2,
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  Search,
  SlidersHorizontal,
  Check,
  Users,
  Globe,
  ChevronDown,
} from "lucide-react";
import { jobOpenings, type JobOpening } from "./careersData";
import { submitJobApplication } from "@/lib/leads";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";
const labelClass =
  "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";

type FacetKey = "team" | "type" | "level" | "location";

interface FacetDef {
  key: FacetKey;
  label: string;
}

const FACETS: FacetDef[] = [
  { key: "team", label: "Department" },
  { key: "type", label: "Employment type" },
  { key: "level", label: "Experience level" },
  { key: "location", label: "Location" },
];

type Selected = Record<FacetKey, Set<string>>;

const emptySelection = (): Selected => ({
  team: new Set(),
  type: new Set(),
  level: new Set(),
  location: new Set(),
});

/* ------------------------------------------------------------------ */
/* Filter sidebar                                                      */
/* ------------------------------------------------------------------ */

function FacetGroup({
  facet,
  options,
  selected,
  onToggle,
}: {
  facet: FacetDef;
  options: { value: string; count: number }[];
  selected: Set<string>;
  onToggle: (key: FacetKey, value: string) => void;
}) {
  if (!options.length) return null;
  return (
    <div className="py-5 border-b border-surface-200 dark:border-surface-800 last:border-0">
      <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">
        {facet.label}
      </h4>
      <div className="space-y-1">
        {options.map((opt) => {
          const active = selected.has(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(facet.key, opt.value)}
              className={`group w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition ${
                active
                  ? "bg-primary-50 dark:bg-primary-900/25 text-primary-700 dark:text-primary-300"
                  : "text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0 transition ${
                  active
                    ? "bg-primary-600 border-primary-600 text-white"
                    : "border-surface-300 dark:border-surface-600 group-hover:border-primary-400"
                }`}
              >
                {active && <Check className="w-3 h-3" strokeWidth={3} />}
              </span>
              <span className="flex-1 text-left">{opt.value}</span>
              <span
                className={`text-xs tabular-nums ${
                  active
                    ? "text-primary-500 dark:text-primary-400"
                    : "text-surface-400"
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FiltersPanel({
  query,
  setQuery,
  facetOptions,
  selected,
  onToggle,
  onClear,
  activeCount,
}: {
  query: string;
  setQuery: (v: string) => void;
  facetOptions: Record<FacetKey, { value: string; count: number }[]>;
  selected: Selected;
  onToggle: (key: FacetKey, value: string) => void;
  onClear: () => void;
  activeCount: number;
}) {
  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search roles…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
        />
      </div>

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-surface-900 dark:text-white">
          <SlidersHorizontal className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="font-semibold text-sm">Filters</span>
        </div>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <div className="divide-y divide-surface-200 dark:divide-surface-800">
        {FACETS.map((facet) => (
          <FacetGroup
            key={facet.key}
            facet={facet}
            options={facetOptions[facet.key]}
            selected={selected[facet.key]}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Job card                                                            */
/* ------------------------------------------------------------------ */

function JobCard({
  job,
  onApply,
}: {
  job: JobOpening;
  onApply: (job: JobOpening) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group relative rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 sm:p-6 transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg">
      <span className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
              {job.team}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-full">
              {job.level}
            </span>
          </div>
          <h3 className="mt-2.5 text-lg font-display font-bold text-surface-900 dark:text-white">
            {job.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-surface-500 dark:text-surface-400">
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
        </div>
        <button
          onClick={() => onApply(job)}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-glow transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          Apply now
        </button>
      </div>

      <p className="mt-4 text-surface-600 dark:text-surface-300 leading-relaxed">
        {job.summary}
      </p>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:gap-2.5 transition-all"
      >
        {open ? "Hide details" : "View details"}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-5 grid gap-6 sm:grid-cols-2 border-t border-surface-100 dark:border-surface-800 pt-5">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

export default function CareersContent() {
  const [activeJob, setActiveJob] = useState<JobOpening | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selected>(emptySelection);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  const toggleFacet = useCallback((key: FacetKey, value: string) => {
    setSelected((prev) => {
      const next = { ...prev, [key]: new Set(prev[key]) };
      if (next[key].has(value)) next[key].delete(value);
      else next[key].add(value);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelected(emptySelection());
    setQuery("");
  }, []);

  const activeCount = useMemo(
    () =>
      FACETS.reduce((n, f) => n + selected[f.key].size, 0) +
      (query.trim() ? 1 : 0),
    [selected, query]
  );

  // Facet option lists with counts, derived from the full dataset.
  const facetOptions = useMemo(() => {
    const build = (key: FacetKey) => {
      const counts = new Map<string, number>();
      for (const job of jobOpenings) {
        const v = job[key];
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      return Array.from(counts.entries()).map(([value, count]) => ({
        value,
        count,
      }));
    };
    return {
      team: build("team"),
      type: build("type"),
      level: build("level"),
      location: build("location"),
    } as Record<FacetKey, { value: string; count: number }[]>;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobOpenings.filter((job) => {
      for (const f of FACETS) {
        const sel = selected[f.key];
        if (sel.size && !sel.has(job[f.key])) return false;
      }
      if (q) {
        const hay = `${job.title} ${job.summary} ${job.team} ${job.level}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, selected]);

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

  const stats = [
    { icon: Briefcase, label: "Open roles", value: jobOpenings.length },
    {
      icon: Users,
      label: "Teams",
      value: new Set(jobOpenings.map((j) => j.team)).size,
    },
    { icon: Globe, label: "Remote-first", value: "India" },
  ];

  // Active filter chips (facets + search)
  const chips: { key: FacetKey | "q"; value: string }[] = [];
  if (query.trim()) chips.push({ key: "q", value: query.trim() });
  for (const f of FACETS)
    for (const v of selected[f.key]) chips.push({ key: f.key, value: v });

  return (
    <main className="flex-1 bg-white dark:bg-surface-900">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-surface-200 dark:border-surface-800 bg-gradient-to-b from-primary-50/60 to-transparent dark:from-primary-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:gap-3 transition-all mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-300 bg-primary-100/70 dark:bg-primary-900/30 px-3 py-1 rounded-full">
            <Sparkles className="w-4 h-4" /> We&apos;re hiring
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-surface-900 dark:text-white max-w-3xl">
            Build the future of EdTech with us
          </h1>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300 leading-relaxed max-w-2xl">
            At DailyTaiyari we help coaching institutes, schools and colleges go
            digital on their own domain. Join a small, high-ownership team
            shipping products that reach thousands of students across India.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/60 backdrop-blur px-4 py-3"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-bold leading-none text-surface-900 dark:text-white">
                    {s.value}
                  </div>
                  <div className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listings with sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <FiltersPanel
                query={query}
                setQuery={setQuery}
                facetOptions={facetOptions}
                selected={selected}
                onToggle={toggleFacet}
                onClear={clearFilters}
                activeCount={activeCount}
              />
            </div>
          </aside>

          {/* Results */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-4 mb-5">
              <p className="text-sm text-surface-600 dark:text-surface-400">
                <span className="font-bold text-surface-900 dark:text-white">
                  {filtered.length}
                </span>{" "}
                {filtered.length === 1 ? "open role" : "open roles"}
                {activeCount > 0 && " matching your filters"}
              </p>
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-semibold text-surface-700 dark:text-surface-200"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filters
                {activeCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>

            {chips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {chips.map((c) => (
                  <button
                    key={`${c.key}-${c.value}`}
                    onClick={() =>
                      c.key === "q"
                        ? setQuery("")
                        : toggleFacet(c.key, c.value)
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 px-3 py-1 text-xs font-medium text-surface-700 dark:text-surface-200 transition"
                  >
                    {c.key === "q" ? `“${c.value}”` : c.value}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="space-y-5">
                {filtered.map((job) => (
                  <JobCard key={job.id} job={job} onApply={openApply} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 py-16 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                  <Search className="w-5 h-5 text-surface-400" />
                </div>
                <h3 className="font-semibold text-surface-900 dark:text-white">
                  No roles match your filters
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  Try clearing some filters to see more openings.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-5 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Open application CTA */}
            <div className="mt-10 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/40 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-lg text-surface-900 dark:text-white">
                  Don&apos;t see a role that fits?
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                  We&apos;re always keen to meet talented people. Tell us how
                  you&apos;d like to contribute.
                </p>
              </div>
              <a
                href="mailto:careers@dailytaiyari.in"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-glow transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                Get in touch <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] lg:hidden bg-surface-950/60 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm overflow-y-auto bg-white dark:bg-surface-900 p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-display font-bold text-lg text-surface-900 dark:text-white">
                  Filters
                </span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                  className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FiltersPanel
                query={query}
                setQuery={setQuery}
                facetOptions={facetOptions}
                selected={selected}
                onToggle={toggleFacet}
                onClear={clearFilters}
                activeCount={activeCount}
              />
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-6 w-full px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition"
              >
                Show {filtered.length}{" "}
                {filtered.length === 1 ? "role" : "roles"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply dialog */}
      <AnimatePresence>
        {activeJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-sm"
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
