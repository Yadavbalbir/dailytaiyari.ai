import Reveal from "./Reveal";
import LeadCTAButtons from "./LeadCTAButtons";
import {
  Building2,
  School,
  GraduationCap,
  Globe,
  MonitorSmartphone,
  LineChart,
  FileText,
  ClipboardList,
  Sparkle,
  Target,
  Database,
  ListChecks,
  Trophy,
  Users,
  Layers,
  Cloud,
  Bot,
  MessagesSquare,
  CheckCircle2,
  TrendingUp,
  Clock,
  MapPin,
  BrainCircuit,
  Rocket,
  Radio,
  ShieldCheck,
  Code2,
  Palette,
} from "lucide-react";

function SectionHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  subtitle: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16">
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
      <p className="text-lg text-surface-600 dark:text-surface-400">{subtitle}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Hooks() {
  const hooks = [
    {
      icon: Rocket,
      title: "Sell your knowledge online",
      desc: "Package your courses, test series and content into a branded portal — and start earning from students anywhere, 24/7.",
      gradient: "from-primary-500 to-primary-600",
    },
    {
      icon: MapPin,
      title: "Run your offline batches with a digital learning portal",
      desc: "Keep teaching in class while every test, assignment, note and quiz lives online — fully tracked, measured and paperless.",
      gradient: "from-accent-500 to-accent-600",
    },
    {
      icon: Globe,
      title: "Get your own website & app",
      desc: "Go live on your own domain with your logo and colors. A modern, mobile-ready learning experience students love — no coding needed.",
      gradient: "from-success-500 to-success-600",
    },
    {
      icon: BrainCircuit,
      title: "Teach smarter with AI",
      desc: "Give every learner a 24/7 AI doubt-solving tutor, auto-graded tests and coding labs — scale your teaching without scaling your effort.",
      gradient: "from-warning-500 to-accent-600",
    },
  ];
  return (
    <section className="py-24 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why DailyTaiyari"
          title="Turn your teaching into a"
          highlight="digital-first business"
          subtitle="Whether you run packed offline batches or want to sell courses online, DailyTaiyari gives you the platform, tools and reach to grow — all under your own brand."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {hooks.map((h, i) => (
            <Reveal key={h.title} index={i}>
              <div className="h-full flex flex-col p-8 rounded-3xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 hover:border-primary-300 dark:hover:border-primary-800 hover:-translate-y-1 transition-all duration-300 group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${h.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <h.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-surface-900 dark:text-white text-lg mb-3 leading-snug">{h.title}</h3>
                <p className="text-surface-600 dark:text-surface-400 leading-relaxed text-sm">{h.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function Audience() {
  const items = [
    {
      icon: Building2,
      title: "Coaching Institutes",
      desc: "Give your JEE, NEET, foundation or any batch a premium digital home. Run test series, share notes and track every aspirant — under your own brand.",
      gradient: "from-primary-500 to-primary-600",
    },
    {
      icon: School,
      title: "Schools",
      desc: "Move class tests, practice and revision online. Teachers publish content in minutes; parents and students see progress clearly.",
      gradient: "from-accent-500 to-accent-600",
    },
    {
      icon: GraduationCap,
      title: "Colleges",
      desc: "Assess at scale across departments and semesters, benchmark cohorts, and build placement-ready skills with measurable outcomes.",
      gradient: "from-success-500 to-success-600",
    },
    {
      icon: Code2,
      title: "Coding & Skill Academies",
      desc: "Host coding bootcamps and skill-development courses with in-browser coding labs, auto-graded assignments, projects and certificates — a modern experience learners actually enjoy.",
      gradient: "from-warning-500 to-accent-600",
    },
  ];
  return (
    <section id="audience" className="py-24 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Who it's for"
          title="One platform for every"
          highlight="learning organization"
          subtitle="Coaching institute software, a school website and portal, a college LMS, or a platform to host coding and skill-development courses — DailyTaiyari adapts to how you teach, from a hundred students to a hundred thousand."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((it, i) => (
            <Reveal key={it.title} index={i}>
              <div className="h-full flex flex-col p-8 rounded-3xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 hover:border-primary-300 dark:hover:border-primary-800 hover:-translate-y-1 transition-all duration-300 group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${it.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <it.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-surface-900 dark:text-white text-xl mb-3">{it.title}</h3>
                <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{it.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function Pillars() {
  const pillars = [
    {
      icon: Globe,
      title: "Your own domain & branding",
      desc: "Launch a fully white-label portal on your own web address, with your logo and colors. Students see your institute — not ours.",
    },
    {
      icon: MonitorSmartphone,
      title: "Go digital & paperless",
      desc: "Notes, formula sheets, question banks, quizzes and full mock tests — all delivered online and accessible on any device.",
    },
    {
      icon: LineChart,
      title: "Real-time performance & skills",
      desc: "Live dashboards reveal how every student and batch is doing, where they struggle, and which skills are improving — instantly.",
    },
  ];
  return (
    <section className="py-24 bg-surface-50 dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((p, i) => (
            <Reveal key={p.title} index={i}>
              <div className="h-full p-8 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-5 shadow-glow">
                  <p.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-surface-900 dark:text-white text-lg mb-2">{p.title}</h3>
                <p className="text-surface-600 dark:text-surface-400 leading-relaxed text-sm">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function OfflineBatches() {
  const tracked = [
    "Homework assigned & submitted",
    "Test and quiz scores",
    "Attendance in daily practice",
    "Topic-wise strengths & gaps",
    "Skill mastery over time",
    "Engagement, streaks & consistency",
  ];
  return (
    <section className="py-24 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-4">
                Offline + Digital
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
                The perfect companion for your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">
                  offline batches
                </span>
              </h2>
              <p className="text-lg text-surface-600 dark:text-surface-400 mb-6 leading-relaxed">
                Keep teaching in the classroom — and let DailyTaiyari handle everything around it.
                Conduct tests, assign homework, share notes and run daily quizzes online, so every
                bit of your physical batch is tracked, measured and improving digitally.
              </p>
              <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                No registers, no scattered PDFs, no guesswork — one place where you and your
                students see exactly how each batch is progressing.
              </p>
            </div>
          </Reveal>

          <Reveal index={1}>
            <div className="rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-8 shadow-sm">
              <p className="text-sm font-bold text-surface-500 uppercase tracking-wider mb-5">
                Everything you track, digitally
              </p>
              <ul className="space-y-4">
                {tracked.map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </span>
                    <span className="text-surface-700 dark:text-surface-300 font-medium">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function Features() {
  const features = [
    { icon: Palette, title: "Modern, beautifully designed UX", desc: "A clean, rich, mobile-first interface designed for delight — fast, intuitive and genuinely enjoyable to use, so students stay engaged and your brand looks world-class.", gradient: "from-accent-500 to-primary-500" },
    { icon: FileText, title: "Share notes & reading material", desc: "Publish structured notes, formula sheets and reading material — with diagrams and images embedded right where they're needed — and share instantly with any batch.", gradient: "from-primary-500 to-primary-600" },
    { icon: ClipboardList, title: "Assign & track homework", desc: "Set homework and assignments with due dates, let students submit online, and track who has completed what — no more chasing pending work.", gradient: "from-accent-500 to-accent-600" },
    { icon: ListChecks, title: "Conduct tests & mock exams", desc: "Create timed, exam-like tests and full-length mock exams with a question palette, mark-for-review, resume-on-refresh, re-attempt limits, instant auto-grading and detailed solutions.", gradient: "from-success-500 to-success-600" },
    { icon: Radio, title: "Live classes & events", desc: "Schedule live classes and events students join in a click, with reminders — bring your whole batch together online, right inside the portal.", gradient: "from-error-500 to-primary-500" },
    { icon: Database, title: "Smart question bank", desc: "Build a reusable bank of MCQ, numerical, assertion-reason, match and image-based questions across every subject and topic.", gradient: "from-warning-500 to-accent-600" },
    { icon: Sparkle, title: "Quizzes for daily practice", desc: "Spin up quick quizzes for daily practice and revision to keep concepts fresh between classes.", gradient: "from-accent-500 to-primary-500" },
    { icon: Target, title: "Personalized learning", desc: "Every student gets a learning experience tuned to their strengths and gaps, so weak areas get the practice they need.", gradient: "from-primary-500 to-success-500" },
    { icon: LineChart, title: "Performance analytics", desc: "Track accuracy, speed, attempt trends and topic-wise strengths for individuals and whole batches in real time.", gradient: "from-warning-500 to-primary-500" },
    { icon: BrainCircuit, title: "Skill & topic mastery", desc: "See exactly which concepts a student has mastered and which need work, so teaching stays targeted.", gradient: "from-primary-500 to-accent-500" },
    { icon: Trophy, title: "Gamification & leaderboards", desc: "Keep students hooked with XP, levels, daily streaks, badges and leaderboards that reward consistency.", gradient: "from-accent-500 to-primary-500" },
    { icon: Users, title: "Roles for your whole team", desc: "Separate access for admins, faculty and students — everyone gets the right tools and the right view.", gradient: "from-success-500 to-primary-500" },
    { icon: Layers, title: "Course catalog & enrollments", desc: "Publish courses with cover thumbnails and named faculty, organize exams, subjects and batches, and let students request enrollment with simple admin approval.", gradient: "from-warning-500 to-accent-500" },
    { icon: ShieldCheck, title: "Secure verified onboarding", desc: "Email-verified sign-up, role-based access and account controls keep your portal secure — admins can approve, suspend or restore students anytime.", gradient: "from-success-500 to-primary-500" },
    { icon: Bot, title: "AI Tutor — instant doubt resolution", desc: "Give every student an always-on AI tutor that answers doubts in seconds with step-by-step explanations, worked examples and formulas — so learning never stalls after class hours.", gradient: "from-primary-500 to-success-500" },
    { icon: Code2, title: "Coding practice & auto-evaluation", desc: "Run a full coding lab in your portal — students write and run code against sample and hidden test cases, with instant auto-graded verdicts, runtime and memory feedback.", gradient: "from-surface-700 to-primary-600" },
    { icon: MessagesSquare, title: "Community & discussion", desc: "Foster peer learning with discussion spaces where students ask, answer and stay engaged together.", gradient: "from-accent-500 to-warning-500" },
    { icon: MonitorSmartphone, title: "Works on any device", desc: "A responsive experience that feels great on phones, tablets and desktops — no app install required.", gradient: "from-success-500 to-accent-500" },
    { icon: Cloud, title: "Secure cloud hosting", desc: "Your portal and content run on reliable cloud infrastructure with secure storage — no servers to manage.", gradient: "from-primary-600 to-accent-600" },
  ];
  return (
    <section id="features" className="py-24 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to run your institute"
          highlight="online"
          subtitle="A complete, AI-powered LMS for exam-prep, coding and skill-development courses — doubt resolution, coding labs, tests, gamification and analytics — wrapped in a modern, delightful UI."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Reveal key={f.title} index={i % 3}>
              <div className="h-full flex flex-col p-7 rounded-3xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700 hover:-translate-y-1 transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-surface-900 dark:text-white text-lg mb-2">{f.title}</h3>
                <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function HowItWorks() {
  const steps = [
    { title: "We set up your portal", desc: "Your branded learning portal goes live on your own domain — logo, colors and all — with zero technical work on your side." },
    { title: "Add your content", desc: "Upload your notes, formula sheets and question bank, or get started fast with a ready-made content structure." },
    { title: "Enroll your students", desc: "Create batches and exams, then invite or approve students into the right programs in a few clicks." },
    { title: "Track & grow", desc: "Watch performance and skills update in real time, act on the insights, and grow your institute with confidence." },
  ];
  return (
    <section id="how" className="py-24 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Live in four simple"
          highlight="steps"
          subtitle="From sign-up to a fully digital institute — without hiring a tech team."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <Reveal key={s.title} index={i}>
              <div className="relative h-full p-8 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white font-display font-bold text-xl flex items-center justify-center mb-5 shadow-glow">
                  {i + 1}
                </div>
                <h3 className="font-bold text-surface-900 dark:text-white text-lg mb-2">{s.title}</h3>
                <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function Grow() {
  const benefits = [
    { icon: Rocket, title: "Build a professional brand", desc: "A polished, modern portal on your own domain signals quality and helps you stand out from other institutes." },
    { icon: MapPin, title: "Reach beyond your city", desc: "Teach students anywhere. Being online removes the walls of a physical classroom and expands your market." },
    { icon: Clock, title: "Save hours every week", desc: "Automated tests, instant grading and reusable content free your teachers to focus on students, not paperwork." },
    { icon: TrendingUp, title: "Make data-driven decisions", desc: "Real-time analytics show what's working and what isn't, so you can improve results — not just guess." },
    { icon: Trophy, title: "Keep students engaged", desc: "Streaks, badges and leaderboards build daily habits that improve retention and word-of-mouth referrals." },
    { icon: BrainCircuit, title: "Scale without the overhead", desc: "Add more students, batches and courses on the same platform — grow revenue without growing complexity." },
  ];
  return (
    <section id="grow" className="py-24 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Grow"
          title="Not just digital —"
          highlight="ready to grow"
          subtitle="Going online is the start. Here's how DailyTaiyari helps your organization grow further."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <Reveal key={b.title} index={i % 3}>
              <div className="h-full flex gap-4 p-6 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <b.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 dark:text-white mb-1">{b.title}</h3>
                  <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function FinalCTA() {
  const points = ["Your own domain & branding", "No technical team needed", "Real-time performance tracking"];
  return (
    <section id="demo" className="py-24 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center bg-gradient-to-br from-primary-600 to-accent-600 shadow-glow-lg">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-10 -left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                Ready to take your institute digital?
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
                See how your own branded learning portal could look. Book a personalized demo and
                we&apos;ll walk you through it.
              </p>
              <LeadCTAButtons />
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {points.map((p) => (
                  <span key={p} className="flex items-center gap-2 text-white/90 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
