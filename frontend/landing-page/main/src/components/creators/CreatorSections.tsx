"use client";

import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Globe,
  Bot,
  Wallet,
  BadgeCheck,
  Code2,
  BarChart3,
  ClipboardCheck,
  Layers,
  Palette,
  Users,
  Sparkles,
  Rocket,
  Building2,
  School,
  GraduationCap,
  Star,
  TrendingUp,
  ArrowRight,
  ListChecks,
  Trophy,
  Database,
  FileText,
  Download,
} from "lucide-react";
import { Youtube, Instagram, Linkedin, Telegram, Whatsapp, Facebook } from "./BrandIcons";
import Marquee from "./Marquee";
import Reveal from "../institutes/Reveal";
import { openLeadDialog } from "@/lib/leads";

/* ── shared heading ────────────────────────────────────────────────── */
function SectionHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-12">
      <span className="inline-block px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-4">
        {eyebrow}
      </span>
      <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
        {title}{" "}
        {highlight && (
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">
            {highlight}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className="text-lg text-surface-600 dark:text-surface-400">{subtitle}</p>
      )}
    </div>
  );
}

/* ── 1. Platforms marquee ──────────────────────────────────────────── */
export function PlatformsMarquee() {
  const platforms = [
    { icon: Youtube, label: "YouTube" },
    { icon: Instagram, label: "Instagram" },
    { icon: Linkedin, label: "LinkedIn" },
    { icon: Telegram, label: "Telegram" },
    { icon: Whatsapp, label: "WhatsApp" },
    { icon: Facebook, label: "Facebook" },
    { icon: Globe, label: "Your Website" },
  ];
  return (
    <section className="py-10 bg-white dark:bg-surface-900 border-y border-surface-200 dark:border-surface-800">
      <p className="text-center text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-6">
        Loved by creators building an audience on
      </p>
      <Marquee speed={26} gapClassName="gap-4">
        {platforms.map((p) => (
          <div
            key={p.label}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800"
          >
            <p.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-surface-700 dark:text-surface-200 whitespace-nowrap">
              {p.label}
            </span>
          </div>
        ))}
      </Marquee>
    </section>
  );
}

/* ── 2. Impact stats + growth graph ────────────────────────────────── */
function Counter({
  to,
  suffix = "",
  prefix = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, mv]);
  return (
    <span ref={ref}>
      {prefix}
      {Math.round(val).toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

export function ImpactStats() {
  const bars = [32, 45, 40, 60, 55, 72, 68, 85, 92];
  return (
    <section className="py-24 bg-surface-50 dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Grow with DailyTaiyari"
          title="Everything you need to"
          highlight="turn followers into revenue"
          subtitle="Stop losing your audience to someone else's platform. Own the relationship, the brand and the earnings."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-5">
            {[
              { icon: Wallet, label: "Revenue kept on your brand", value: 100, suffix: "%", c: "from-primary-500 to-primary-600" },
              { icon: Globe, label: "Your own domain & branding", value: 1, suffix: " site", c: "from-accent-500 to-accent-600" },
              { icon: Bot, label: "AI tutor answering doubts", value: 24, suffix: "/7", c: "from-success-500 to-success-600" },
              { icon: Rocket, label: "Go live in days, not months", value: 3, suffix: " steps", c: "from-warning-500 to-accent-600" },
            ].map((s, i) => (
              <Reveal key={s.label} index={i}>
                <div className="h-full p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.c} flex items-center justify-center mb-4 shadow-lg`}>
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-display font-bold text-surface-900 dark:text-white">
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Growth graph */}
          <Reveal index={1}>
            <div className="h-full p-8 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-semibold text-surface-500 dark:text-surface-400">
                    Your earnings, compounding
                  </p>
                  <p className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                    Month-on-month growth
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 text-sm font-bold">
                  <TrendingUp className="w-4 h-4" /> Trending up
                </span>
              </div>
              <div className="flex-1 flex items-end gap-2 sm:gap-3 min-h-[220px]">
                {bars.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 rounded-t-lg bg-gradient-to-t from-primary-500 to-accent-500 relative group"
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition text-[10px] font-bold text-surface-500">
                      {h}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-[11px] text-surface-400 font-medium">
                <span>Launch</span>
                <span>Grow</span>
                <span>Scale</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── 3. Feature marquees (two opposite rows) ───────────────────────── */
/* ── 3. Student experience — auto-scrolling feature cards ──────────── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  c,
  visual,
}: {
  icon: typeof Globe;
  title: string;
  desc: string;
  c: string;
  visual: ReactNode;
}) {
  return (
    <div className="w-80 shrink-0 rounded-3xl overflow-hidden bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
      {/* graphic header */}
      <div className={`relative h-28 bg-gradient-to-br ${c} p-4 overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white rounded-full blur-2xl" />
        </div>
        <div className="relative flex items-center gap-2 text-white">
          <span className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </span>
        </div>
        <div className="relative mt-2">{visual}</div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-surface-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

/* small inline graphics reused inside cards */
const VizBars = () => (
  <div className="flex items-end gap-1 h-8">
    {[40, 70, 55, 85, 65, 95].map((h, i) => (
      <div key={i} className="flex-1 rounded-t bg-white/70" style={{ height: `${h}%` }} />
    ))}
  </div>
);
const VizPalette = () => (
  <div className="grid grid-cols-8 gap-1">
    {Array.from({ length: 16 }).map((_, i) => (
      <div
        key={i}
        className={`h-3 rounded ${[3, 7, 10].includes(i) ? "bg-white" : "bg-white/40"}`}
      />
    ))}
  </div>
);
const VizCourse = () => (
  <div className="flex gap-1.5">
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex-1 rounded-lg bg-white/25 h-8 border border-white/30" />
    ))}
  </div>
);
const VizChat = () => (
  <div className="space-y-1.5">
    <div className="h-2.5 w-3/4 rounded-full bg-white/70" />
    <div className="h-2.5 w-1/2 rounded-full bg-white/40 ml-auto" />
  </div>
);
const VizCode = () => (
  <div className="space-y-1 font-mono">
    <div className="h-2 w-2/3 rounded bg-white/70" />
    <div className="h-2 w-1/2 rounded bg-white/40 ml-4" />
    <div className="h-2 w-3/5 rounded bg-white/40 ml-4" />
  </div>
);
const VizCert = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full border-2 border-white/70 flex items-center justify-center">
      <BadgeCheck className="w-4 h-4 text-white" />
    </div>
    <div className="flex-1 space-y-1">
      <div className="h-2 w-full rounded bg-white/60" />
      <div className="h-2 w-2/3 rounded bg-white/30" />
    </div>
  </div>
);
const VizReport = () => (
  <div className="flex items-center gap-2">
    <FileText className="w-7 h-7 text-white/90" />
    <div className="flex-1 space-y-1">
      <div className="h-2 w-full rounded bg-white/60" />
      <div className="h-2 w-1/2 rounded bg-white/30" />
    </div>
    <Download className="w-5 h-5 text-white/90" />
  </div>
);
const VizBuilder = () => (
  <div className="space-y-1.5">
    <div className="h-3 rounded bg-white/60 w-full" />
    <div className="flex gap-1.5">
      <div className="h-3 rounded bg-white/40 w-1/3" />
      <div className="h-3 rounded bg-white/40 w-1/3" />
      <div className="h-3 rounded bg-white/40 w-1/4" />
    </div>
  </div>
);
const VizSpark = () => (
  <div className="flex items-center gap-2">
    <Sparkles className="w-6 h-6 text-white" />
    <div className="flex-1 space-y-1">
      <div className="h-2.5 w-full rounded-full bg-white/70" />
      <div className="h-2.5 w-3/4 rounded-full bg-white/40" />
    </div>
  </div>
);

export function StudentExperience() {
  const cards = [
    { icon: GraduationCap, title: "Branded course pages", desc: "Beautiful course landing pages with your logo, banner and pricing — ready to sell.", c: "from-primary-500 to-primary-600", visual: <VizCourse /> },
    { icon: ClipboardCheck, title: "Interactive quizzes", desc: "Topic-wise quizzes with instant scoring and detailed solutions.", c: "from-accent-500 to-accent-600", visual: <VizChat /> },
    { icon: ListChecks, title: "Timed mock tests", desc: "Real exam UI — question palette, mark-for-review, resume on refresh, instant results.", c: "from-warning-500 to-accent-600", visual: <VizPalette /> },
    { icon: Bot, title: "24/7 AI doubt-solver", desc: "Every student gets a personal AI tutor with step-by-step explanations.", c: "from-success-500 to-success-600", visual: <VizChat /> },
    { icon: Code2, title: "Coding labs", desc: "Write & run code against test cases with instant auto-graded verdicts.", c: "from-primary-600 to-accent-500", visual: <VizCode /> },
    { icon: BadgeCheck, title: "Certificates", desc: "Learners earn certificates they can showcase online.", c: "from-accent-500 to-primary-500", visual: <VizCert /> },
    { icon: Trophy, title: "XP, streaks & leaderboards", desc: "Gamified progress that turns practice into a daily habit.", c: "from-warning-500 to-warning-600", visual: <VizBars /> },
  ];
  return (
    <section id="features" className="py-20 bg-white dark:bg-surface-900 border-y border-surface-200 dark:border-surface-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="For your students"
          title="A learning experience students"
          highlight="actually love"
          subtitle="Courses, quizzes, mock tests, coding labs and an AI tutor — all under your brand."
        />
      </div>
      <Marquee speed={46} gapClassName="gap-6">
        {cards.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </Marquee>
    </section>
  );
}

export function CreatorConsole() {
  const cards = [
    { icon: Sparkles, title: "AI-assisted content creation", desc: "Generate course outlines, lessons, quizzes and questions with AI — launch faster.", c: "from-accent-500 to-primary-500", visual: <VizSpark /> },
    { icon: Layers, title: "No-code course builder", desc: "Drag together chapters, videos, notes, quizzes and assignments — no coding.", c: "from-primary-500 to-primary-600", visual: <VizBuilder /> },
    { icon: Database, title: "Question bank & test builder", desc: "Build a reusable question bank and assemble timed tests in minutes.", c: "from-accent-500 to-accent-600", visual: <VizBuilder /> },
    { icon: Download, title: "Downloadable reports", desc: "Export attendance, scores and performance reports as ready-to-share files.", c: "from-success-500 to-success-600", visual: <VizReport /> },
    { icon: BarChart3, title: "Analytics dashboard", desc: "Track enrolments, engagement and revenue at a glance.", c: "from-primary-600 to-accent-500", visual: <VizBars /> },
    { icon: Users, title: "Student management", desc: "Approve enrolments, manage batches and message learners from one console.", c: "from-warning-500 to-accent-600", visual: <VizBuilder /> },
    { icon: Wallet, title: "Payments & revenue", desc: "Sell courses, collect payments and keep your earnings on your own brand.", c: "from-success-600 to-primary-500", visual: <VizReport /> },
    { icon: Palette, title: "Your branding & domain", desc: "Your logo, colors and custom domain — a portal that looks entirely yours.", c: "from-accent-500 to-primary-500", visual: <VizBuilder /> },
  ];
  return (
    <section className="py-20 bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="For you — the admin console"
          title="Run everything from"
          highlight="one powerful dashboard"
          subtitle="Create content with AI, manage students, and export reports — no technical team needed."
        />
      </div>
      <Marquee speed={52} reverse gapClassName="gap-6">
        {cards.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </Marquee>
    </section>
  );
}

/* ── 4. How it works ───────────────────────────────────────────────── */
export function HowItWorks() {
  const steps = [
    {
      icon: Users,
      title: "Bring your audience",
      desc: "You already have followers on YouTube, Instagram or LinkedIn. Point them to your own branded site.",
      c: "from-primary-500 to-primary-600",
    },
    {
      icon: Layers,
      title: "Build your course",
      desc: "Add videos, notes, quizzes, coding labs and live classes with a simple, no-code course builder.",
      c: "from-accent-500 to-accent-600",
    },
    {
      icon: Rocket,
      title: "Sell on your brand",
      desc: "Set your price, collect payments directly, and let the AI tutor scale your teaching 24/7.",
      c: "from-success-500 to-success-600",
    },
  ];
  return (
    <section id="how" className="py-24 bg-surface-50 dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From follower to paying student in"
          highlight="3 simple steps"
          subtitle="Start your online learning portal in minutes — no code, no tech team."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((s, i) => (
            <Reveal key={s.title} index={i}>
              <div className="h-full p-8 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 relative">
                <span className="absolute top-6 right-6 text-5xl font-display font-bold text-surface-100 dark:text-surface-800 select-none">
                  {i + 1}
                </span>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.c} flex items-center justify-center mb-6 shadow-lg`}>
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-surface-900 dark:text-white text-xl mb-3">{s.title}</h3>
                <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 5. Course showcase marquee ────────────────────────────────────── */
export function CourseShowcase() {
  const courses = [
    { title: "Full-Stack Web Dev", tag: "Cohort", c: "from-primary-500 to-accent-500", price: "₹4,999" },
    { title: "Stock Market Mastery", tag: "Self-paced", c: "from-success-500 to-primary-500", price: "₹1,999" },
    { title: "UI/UX Design Bootcamp", tag: "Live", c: "from-accent-500 to-warning-500", price: "₹3,499" },
    { title: "Spoken English Pro", tag: "Self-paced", c: "from-warning-500 to-accent-500", price: "₹999" },
    { title: "Data Science with Python", tag: "Cohort", c: "from-primary-600 to-success-500", price: "₹5,999" },
    { title: "Digital Marketing 101", tag: "Self-paced", c: "from-accent-600 to-primary-500", price: "₹2,499" },
  ];
  return (
    <section className="py-24 bg-white dark:bg-surface-900 border-y border-surface-200 dark:border-surface-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Any subject, any format"
          title="If you can teach it, you can"
          highlight="sell it here"
          subtitle="Cohorts, self-paced courses, test series, live classes — creators across every niche run them on DailyTaiyari."
        />
      </div>
      <Marquee speed={44} gapClassName="gap-6">
        {courses.map((c) => (
          <div
            key={c.title}
            className="w-72 rounded-3xl overflow-hidden bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 shadow-sm"
          >
            <div className={`h-32 bg-gradient-to-br ${c.c} relative`}>
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-surface-800 text-xs font-bold">
                {c.tag}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-surface-900 dark:text-white text-lg">{c.title}</h3>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-surface-500 text-sm">Your price</span>
                <span className="font-display font-bold text-success-600 dark:text-success-400">
                  {c.price}
                </span>
              </div>
            </div>
          </div>
        ))}
      </Marquee>
    </section>
  );
}

/* ── 6. Testimonials marquee ───────────────────────────────────────── */
export function TestimonialsMarquee() {
  const testimonials = [
    { name: "Ananya R.", handle: "YouTube · 120K subs", quote: "I finally own my audience. My students learn on my site, not someone else's app.", c: "from-primary-500 to-accent-500" },
    { name: "Rahul M.", handle: "Instagram educator", quote: "Set up my branded course site in a weekend. The AI tutor handles doubts while I sleep.", c: "from-success-500 to-primary-500" },
    { name: "Sneha K.", handle: "LinkedIn coach", quote: "Payments, certificates, analytics — all in one place. No more juggling 5 tools.", c: "from-accent-500 to-warning-500" },
    { name: "Vikram S.", handle: "Telegram · test series", quote: "My test-series business doubled once everything moved onto my own branded portal.", c: "from-warning-500 to-accent-500" },
    { name: "Meera J.", handle: "Independent teacher", quote: "It looks like I hired a whole tech team. Students think my brand is a big company.", c: "from-primary-600 to-success-500" },
  ];
  return (
    <section className="py-24 bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Creators love it"
          title="Built for people who"
          highlight="teach for a living"
        />
      </div>
      <Marquee speed={50} gapClassName="gap-6" pauseOnHover>
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="w-[22rem] p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm"
          >
            <div className="flex items-center gap-1 mb-4 text-warning-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-surface-700 dark:text-surface-200 leading-relaxed mb-6">
              “{t.quote}”
            </p>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.c}`} />
              <div>
                <p className="font-bold text-surface-900 dark:text-white text-sm">{t.name}</p>
                <p className="text-surface-500 text-xs">{t.handle}</p>
              </div>
            </div>
          </div>
        ))}
      </Marquee>
    </section>
  );
}

/* ── 7. Audience + Book-a-Demo card ────────────────────────────────── */
export function Audience() {
  const primary = [
    {
      icon: Sparkles,
      title: "Knowledge Creators",
      desc: "You teach on YouTube, Instagram, LinkedIn or Telegram. Turn that audience into a real business on your own branded site.",
      c: "from-primary-500 to-accent-500",
    },
    {
      icon: Building2,
      title: "Coaching Institutes",
      desc: "Give your JEE/NEET/UPSC or skill batches a premium digital home — test series, notes and tracking under your own brand.",
      c: "from-accent-500 to-primary-600",
    },
  ];
  const secondary = [
    { icon: School, title: "Schools", desc: "A digital campus for classes, notes & assessments." },
    { icon: GraduationCap, title: "Colleges", desc: "Skill programs, placement prep & certifications." },
  ];
  const demoPoints = [
    "A branded portal set up for you",
    "AI content-creation walkthrough",
    "Pricing tailored to your scale",
  ];
  return (
    <section id="audience" className="py-24 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Who it's for"
          title="Built for creators &"
          highlight="coaching institutes"
          subtitle="If you teach, DailyTaiyari gives you the platform to sell and scale — under your own brand."
        />

        {/* Two primary audiences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {primary.map((p, i) => (
            <Reveal key={p.title} index={i}>
              <div className="h-full p-8 rounded-3xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 flex items-start gap-5">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.c} flex items-center justify-center shadow-lg shrink-0`}>
                  <p.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 dark:text-white text-xl mb-2">{p.title}</h3>
                  <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Book a Demo card */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 [background-size:200%_200%] animate-gradient text-white">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            </div>
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 sm:p-12">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-5">
                  <Rocket className="w-4 h-4" /> Free personalised demo
                </span>
                <h3 className="text-3xl sm:text-4xl font-display font-bold mb-4 leading-tight">
                  See your branded academy in 20 minutes
                </h3>
                <p className="text-white/90 text-lg mb-6">
                  Tell us what you teach — we&apos;ll show you exactly how your courses, tests
                  and AI-assisted content would look and sell on your own DailyTaiyari site.
                </p>
                <ul className="space-y-2.5 mb-8">
                  {demoPoints.map((pt) => (
                    <li key={pt} className="flex items-center gap-3 text-white/95">
                      <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <BadgeCheck className="w-4 h-4" />
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => openLeadDialog("demo")}
                    className="px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2"
                  >
                    Book a Demo <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openLeadDialog("contact")}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-xl font-bold text-lg transition-all hover:scale-105"
                  >
                    Ask a question
                  </button>
                </div>
              </div>

              {/* mini visual */}
              <div className="hidden lg:block">
                <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/25" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-2/3 rounded-full bg-white/60" />
                      <div className="h-2 w-1/3 rounded-full bg-white/30" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-bold">
                      Live
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["Courses", "Tests", "Reports"].map((t) => (
                      <div key={t} className="rounded-xl bg-white/10 p-3">
                        <div className="h-8 rounded-lg bg-white/25 mb-2" />
                        <div className="text-[10px] font-semibold text-white/90">{t}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <div className="flex items-end gap-1.5 h-16">
                      {[45, 62, 55, 78, 70, 90].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-white/60" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Secondary: schools & colleges */}
        <div className="mt-10">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-6">
            Also perfect for schools & colleges
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {secondary.map((s, i) => (
              <Reveal key={s.title} index={i}>
                <div className="h-full p-6 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">{s.title}</h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ─────────────────────────────────────────────────────── */
export function FinalCTA() {
  return (
    <section className="py-24 bg-surface-50 dark:bg-surface-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-surface-900 dark:bg-surface-800 px-8 py-16 sm:px-16 text-center">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute -top-20 -left-10 w-80 h-80 bg-primary-500 rounded-full blur-[120px]" />
              <div className="absolute -bottom-20 -right-10 w-80 h-80 bg-accent-500 rounded-full blur-[120px]" />
            </div>
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                Ready to sell your knowledge on your own brand?
              </h2>
              <p className="text-surface-300 text-lg mb-8 max-w-2xl mx-auto">
                Join the creators turning their audience into a real, ownable business.
                Book a free demo and we&apos;ll set up your branded site.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => openLeadDialog("demo")}
                  className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-glow transition-all hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2"
                >
                  Book a Demo <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openLeadDialog("contact")}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-lg transition-all hover:scale-105"
                >
                  Talk to us
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
