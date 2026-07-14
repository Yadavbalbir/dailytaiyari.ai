"use client";

import Reveal from "./Reveal";
import {
  Flame,
  Zap,
  Clock,
  CheckCircle2,
  Bookmark,
  Radio,
  MessageCircle,
  ThumbsUp,
  TrendingUp,
  Target,
  BookOpen,
  ChevronRight,
  CalendarClock,
  ShieldCheck,
  GripVertical,
  Plus,
  Image as ImageIcon,
  Eye,
  FileQuestion,
  UserCheck,
  Users,
  Sliders,
  Bot,
  Sparkles,
  Send,
  Code2,
  Play,
  Trophy,
  Medal,
  Crown,
  Award,
  FileCheck,
} from "lucide-react";

/* ---------------------------------------------------------------- */
/* Reusable browser frame that wraps each product preview           */
/* ---------------------------------------------------------------- */
function BrowserFrame({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <span className="w-3 h-3 rounded-full bg-error-400" />
        <span className="w-3 h-3 rounded-full bg-warning-400" />
        <span className="w-3 h-3 rounded-full bg-success-400" />
        <div className="ml-3 flex-1 h-6 rounded-md bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 flex items-center px-3">
          <span className="text-[11px] text-surface-500 font-mono truncate">{path}</span>
        </div>
      </div>
      <div className="p-4 sm:p-5 bg-surface-50 dark:bg-surface-950">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* 1. Student dashboard preview                                     */
/* ---------------------------------------------------------------- */
function DashboardPreview() {
  const courses = [
    { name: "JEE Physics", tutor: "by Faculty", c: "from-primary-500 to-primary-600" },
    { name: "Chemistry XI", tutor: "by Faculty", c: "from-accent-500 to-accent-600" },
    { name: "Maths Crash", tutor: "by Faculty", c: "from-success-500 to-success-600" },
  ];
  return (
    <BrowserFrame path="learn.your-institute.com/dashboard">
      <div className="space-y-4">
        {/* greeting + streak */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-40 rounded bg-surface-300 dark:bg-surface-700" />
            <div className="mt-2 h-2.5 w-28 rounded bg-surface-200 dark:bg-surface-800" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 font-bold text-sm">
            <Flame className="w-4 h-4" /> 12-day streak
          </div>
        </div>

        {/* stat row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Zap, label: "Level 7", sub: "1,240 XP", c: "text-primary-600 bg-primary-100 dark:bg-primary-900/30" },
            { icon: Target, label: "84%", sub: "Accuracy", c: "text-success-600 bg-success-100 dark:bg-success-900/30" },
            { icon: Clock, label: "45m", sub: "Today", c: "text-accent-600 bg-accent-100 dark:bg-accent-900/30" },
          ].map((s) => (
            <div key={s.sub} className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.c}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-surface-900 dark:text-white">{s.label}</div>
              <div className="text-[10px] text-surface-500">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* enrolled courses slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">My courses</span>
            <span className="text-[11px] text-primary-600 font-semibold flex items-center gap-0.5">View all <ChevronRight className="w-3 h-3" /></span>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {courses.map((co) => (
              <div key={co.name} className="min-w-[45%] rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden">
                <div className={`h-12 bg-gradient-to-br ${co.c}`} />
                <div className="p-2.5">
                  <div className="text-xs font-bold text-surface-900 dark:text-white truncate">{co.name}</div>
                  <div className="text-[10px] text-surface-500">{co.tutor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------------------------------------------------------------- */
/* 2. Mock test preview                                             */
/* ---------------------------------------------------------------- */
function MockTestPreview() {
  const palette = [
    "a", "a", "m", "u", "a", "u", "a", "m", "u", "a", "a", "u",
  ];
  const tone: Record<string, string> = {
    a: "bg-success-500 text-white",
    m: "bg-accent-500 text-white",
    u: "bg-surface-200 dark:bg-surface-700 text-surface-500",
  };
  return (
    <BrowserFrame path="learn.your-institute.com/mock-tests/attempt">
      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          {/* timer bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-surface-500">Physics · Q4 of 30</span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400 text-xs font-bold font-mono">
              <Clock className="w-3.5 h-3.5" /> 58:24
            </span>
          </div>
          {/* question */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
            <div className="h-2.5 w-full rounded bg-surface-200 dark:bg-surface-800 mb-1.5" />
            <div className="h-2.5 w-2/3 rounded bg-surface-200 dark:bg-surface-800 mb-3" />
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                    i === 1
                      ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
                      : "border-surface-200 dark:border-surface-800"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 ${i === 1 ? "border-primary-500 bg-primary-500" : "border-surface-300 dark:border-surface-600"}`} />
                  <span className="h-2 w-1/2 rounded bg-surface-200 dark:bg-surface-800" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* palette */}
        <div className="hidden sm:block w-28 shrink-0">
          <div className="text-[10px] font-bold text-surface-500 uppercase mb-2">Palette</div>
          <div className="grid grid-cols-4 gap-1.5">
            {palette.map((p, i) => (
              <span key={i} className={`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center ${tone[p]}`}>
                {i + 1}
              </span>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 text-[10px] text-surface-500">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success-500" /> Answered</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-accent-500" /> Marked</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-surface-300 dark:bg-surface-600" /> Not visited</div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------------------------------------------------------------- */
/* 3. Live classes & community preview                              */
/* ---------------------------------------------------------------- */
function CommunityPreview() {
  return (
    <BrowserFrame path="learn.your-institute.com/community">
      <div className="space-y-3">
        {/* live class event */}
        <div className="rounded-2xl border border-error-200 dark:border-error-900/40 bg-white dark:bg-surface-900 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-error-500 text-white text-[10px] font-bold uppercase tracking-wide">
              <Radio className="w-3 h-3 animate-pulse" /> Live now
            </span>
            <span className="flex items-center gap-1 text-[10px] text-surface-500"><CalendarClock className="w-3 h-3" /> Today · 6:00 PM</span>
          </div>
          <div className="text-sm font-bold text-surface-900 dark:text-white">Rotational Motion — Doubt Session</div>
          <div className="text-[11px] text-surface-500 mb-2">Python & Physics batch · with your faculty</div>
          <button className="w-full py-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white text-xs font-bold">
            Join live class
          </button>
        </div>

        {/* discussion thread */}
        {[
          { q: "How to approach pulley problems with two blocks?", r: 8, up: 24 },
          { q: "Best strategy for the last 30 days before mains?", r: 15, up: 41 },
        ].map((d) => (
          <div key={d.q} className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
            <div className="text-xs font-semibold text-surface-900 dark:text-white mb-2">{d.q}</div>
            <div className="flex items-center gap-3 text-[10px] text-surface-500">
              <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {d.up}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {d.r} replies</span>
              <span className="ml-auto px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/30 text-primary-600 font-semibold">Discussion</span>
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

/* ---------------------------------------------------------------- */
/* 4. Analytics & skill mastery preview                             */
/* ---------------------------------------------------------------- */
function AnalyticsPreview() {
  const topics = [
    { name: "Kinematics", v: 92, c: "from-success-500 to-success-600" },
    { name: "Thermodynamics", v: 74, c: "from-primary-500 to-primary-600" },
    { name: "Electrostatics", v: 58, c: "from-warning-500 to-warning-600" },
    { name: "Optics", v: 41, c: "from-error-500 to-error-600" },
  ];
  return (
    <BrowserFrame path="learn.your-institute.com/analytics">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
            <div className="text-[10px] text-surface-500 mb-1">Accuracy trend</div>
            <div className="flex items-end gap-1.5 h-16">
              {[45, 60, 52, 70, 66, 82, 78].map((h, i) => (
                <span key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary-500/80 to-accent-500/80" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-success-600 text-xs font-bold"><TrendingUp className="w-4 h-4" /> +18%</div>
            <div className="text-[10px] text-surface-500 mt-1">improvement this month across your batch</div>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
          <div className="text-[10px] font-bold text-surface-500 uppercase mb-3">Topic mastery</div>
          <div className="space-y-2.5">
            {topics.map((t) => (
              <div key={t.name}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-surface-700 dark:text-surface-300 font-medium">{t.name}</span>
                  <span className="text-surface-500">{t.v}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                  <span className={`block h-full rounded-full bg-gradient-to-r ${t.c}`} style={{ width: `${t.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------------------------------------------------------------- */
/* AI Tutor — doubt resolution preview                              */
/* ---------------------------------------------------------------- */
function AITutorPreview() {
  return (
    <BrowserFrame path="learn.your-institute.com/ai-tutor">
      <div className="space-y-3">
        {/* assistant header */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-surface-200 dark:border-surface-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-surface-900 dark:text-white flex items-center gap-1.5">
              AI Tutor <Sparkles className="w-3.5 h-3.5 text-accent-500" />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-success-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500" /> Online · 24/7
            </div>
          </div>
        </div>

        {/* student question */}
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary-600 text-white px-3 py-2 text-[11px] font-medium">
            Why is acceleration zero at the top of projectile motion?
          </div>
        </div>

        {/* AI answer */}
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-3 h-3" />
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-3 py-2.5 space-y-2">
            <div className="h-2 w-full rounded bg-surface-200 dark:bg-surface-800" />
            <div className="h-2 w-11/12 rounded bg-surface-200 dark:bg-surface-800" />
            <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 px-2 py-1.5 text-[10px] font-mono text-primary-700 dark:text-primary-300">
              aₓ = 0,&nbsp;&nbsp;a_y = −g
            </div>
            <div className="h-2 w-3/4 rounded bg-surface-200 dark:bg-surface-800" />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-600 text-[9px] font-semibold">Step-by-step</span>
              <span className="px-2 py-0.5 rounded-full bg-success-50 dark:bg-success-900/30 text-success-600 text-[9px] font-semibold">Solved instantly</span>
            </div>
          </div>
        </div>

        {/* input */}
        <div className="flex items-center gap-2 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-3 py-2">
          <span className="text-[11px] text-surface-400 flex-1">Ask a follow-up…</span>
          <span className="w-6 h-6 rounded-lg bg-primary-600 flex items-center justify-center text-white">
            <Send className="w-3 h-3" />
          </span>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------------------------------------------------------------- */
/* Coding problem evaluation preview                                */
/* ---------------------------------------------------------------- */
function CodingPreview() {
  return (
    <BrowserFrame path="learn.your-institute.com/coding/two-sum">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-bold text-surface-900 dark:text-white">Two Sum</span>
            <span className="px-1.5 py-0.5 rounded bg-success-100 dark:bg-success-900/30 text-success-600 text-[9px] font-bold uppercase">Easy</span>
          </div>
          <span className="text-[10px] text-surface-500">Python</span>
        </div>

        {/* editor */}
        <div className="rounded-xl bg-surface-900 dark:bg-black p-3 font-mono text-[10px] leading-relaxed">
          <div><span className="text-accent-400">def</span> <span className="text-primary-300">twoSum</span>(nums, target):</div>
          <div className="pl-3"><span className="text-accent-400">seen</span> = {"{}"}</div>
          <div className="pl-3"><span className="text-accent-400">for</span> i, n <span className="text-accent-400">in</span> enumerate(nums):</div>
          <div className="pl-6"><span className="text-accent-400">if</span> target - n <span className="text-accent-400">in</span> seen:</div>
          <div className="pl-9 text-success-400">return [seen[target - n], i]</div>
          <div className="pl-6">seen[n] = i</div>
        </div>

        {/* verdict */}
        <div className="flex items-center justify-between rounded-xl border border-success-200 dark:border-success-900/40 bg-success-50 dark:bg-success-900/20 px-3 py-2">
          <span className="flex items-center gap-1.5 text-success-700 dark:text-success-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Accepted
          </span>
          <span className="text-[10px] text-surface-500 font-mono">42 ms · 14.1 MB</span>
        </div>

        {/* test cases */}
        <div className="grid grid-cols-3 gap-2">
          {["Sample", "Edge", "Hidden"].map((t) => (
            <div key={t} className="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-2 py-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-success-500" />
              <span className="text-[9px] text-surface-600 dark:text-surface-400 font-semibold">{t}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <span className="flex-1 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 text-center text-[10px] font-semibold text-surface-600 dark:text-surface-300 flex items-center justify-center gap-1">
            <Play className="w-3 h-3" /> Run
          </span>
          <span className="flex-1 py-1.5 rounded-lg bg-primary-600 text-white text-center text-[10px] font-bold">Submit</span>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------------------------------------------------------------- */
/* Assignments & homework preview                                   */
/* ---------------------------------------------------------------- */
function AssignmentPreview() {
  const items = [
    { name: "Rotational Motion — Problem Set 4", meta: "Due in 2 days", state: "submitted" },
    { name: "Organic Chemistry Worksheet", meta: "Graded · 18/20", state: "graded" },
    { name: "Calculus — Integration Homework", meta: "Due tomorrow", state: "pending" },
  ];
  const badge: Record<string, string> = {
    submitted: "bg-primary-100 dark:bg-primary-900/30 text-primary-600",
    graded: "bg-success-100 dark:bg-success-900/30 text-success-600",
    pending: "bg-warning-100 dark:bg-warning-900/30 text-warning-600",
  };
  const label: Record<string, string> = { submitted: "Submitted", graded: "Graded", pending: "Pending" };
  return (
    <BrowserFrame path="learn.your-institute.com/assignments">
      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.name} className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-accent-500 shrink-0" />
                <span className="text-xs font-bold text-surface-900 dark:text-white">{a.name}</span>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${badge[a.state]}`}>{label[a.state]}</span>
            </div>
            <div className="text-[10px] text-surface-500 pl-6">{a.meta}</div>
            {a.state === "graded" && (
              <div className="mt-2 ml-6 rounded-lg bg-success-50 dark:bg-success-900/20 px-2.5 py-1.5">
                <div className="text-[9px] font-bold text-success-700 dark:text-success-400 mb-1">Teacher feedback</div>
                <div className="h-1.5 w-full rounded bg-success-200/60 dark:bg-success-800/40 mb-1" />
                <div className="h-1.5 w-3/4 rounded bg-success-200/60 dark:bg-success-800/40" />
              </div>
            )}
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

/* ---------------------------------------------------------------- */
/* Leaderboard & gamification preview                               */
/* ---------------------------------------------------------------- */
function LeaderboardPreview() {
  const rows = [
    { rank: 1, xp: "4,820", c: "from-warning-400 to-warning-500", you: false },
    { rank: 2, xp: "4,510", c: "from-surface-300 to-surface-400", you: false },
    { rank: 3, xp: "4,190", c: "from-primary-400 to-accent-400", you: false },
    { rank: 7, xp: "3,240", c: "from-accent-500 to-primary-500", you: true },
  ];
  return (
    <BrowserFrame path="learn.your-institute.com/leaderboard">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-bold text-surface-900 dark:text-white">
            <Trophy className="w-4 h-4 text-warning-500" /> Weekly leaderboard
          </span>
          <span className="flex gap-1">
            <span className="px-2 py-0.5 rounded-full bg-primary-600 text-white text-[9px] font-bold">Week</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 text-[9px] font-semibold">All-time</span>
          </span>
        </div>

        {/* ranked rows */}
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.rank}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                r.you
                  ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
                  : "border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900"
              }`}
            >
              <span className="w-5 text-center text-xs font-bold text-surface-500">
                {r.rank === 1 ? <Crown className="w-4 h-4 text-warning-500 mx-auto" /> : r.rank <= 3 ? <Medal className="w-4 h-4 text-surface-400 mx-auto" /> : `#${r.rank}`}
              </span>
              <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${r.c}`} />
              <div className="flex-1">
                <div className="h-2 w-24 rounded bg-surface-200 dark:bg-surface-800" />
                {r.you && <div className="text-[9px] text-primary-600 font-bold mt-1">You</div>}
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-surface-700 dark:text-surface-300">
                <Zap className="w-3.5 h-3.5 text-primary-500" /> {r.xp}
              </span>
            </div>
          ))}
        </div>

        {/* badges */}
        <div className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
          <div className="text-[10px] font-bold text-surface-500 uppercase mb-2">Badges earned</div>
          <div className="flex gap-2">
            {["from-warning-400 to-warning-500", "from-primary-500 to-accent-500", "from-success-400 to-success-500", "from-accent-500 to-primary-500"].map((c, i) => (
              <span key={i} className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c} flex items-center justify-center text-white`}>
                <Award className="w-4 h-4" />
              </span>
            ))}
            <span className="w-8 h-8 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-700 flex items-center justify-center text-surface-400 text-[9px] font-bold">+6</span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------------------------------------------------------------- */
/* 5. Admin — course builder preview                                */
/* ---------------------------------------------------------------- */
function CourseBuilderPreview() {
  const modules = [
    { name: "Chapter 1 · Kinematics", items: ["Notes", "Video", "Quiz"], open: true },
    { name: "Chapter 2 · Laws of Motion", items: ["Notes", "Assignment"], open: false },
    { name: "Chapter 3 · Work & Energy", items: ["Notes", "Mock test"], open: false },
  ];
  return (
    <BrowserFrame path="business.your-institute.com/admin/courses/builder">
      <div className="flex gap-4">
        {/* course meta + thumbnail */}
        <div className="hidden sm:block w-32 shrink-0">
          <div className="rounded-xl overflow-hidden border border-surface-200 dark:border-surface-800">
            <div className="h-16 bg-gradient-to-br from-primary-500 to-accent-500 relative">
              <span className="absolute bottom-1 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 text-white text-[9px] font-semibold">
                <ImageIcon className="w-2.5 h-2.5" /> Cover
              </span>
            </div>
            <div className="p-2">
              <div className="h-2 w-4/5 rounded bg-surface-300 dark:bg-surface-700 mb-1.5" />
              <div className="h-1.5 w-full rounded bg-surface-200 dark:bg-surface-800" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 text-[10px] font-bold justify-center">
            <Eye className="w-3 h-3" /> Published
          </div>
        </div>

        {/* curriculum builder */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Curriculum</span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-600 text-white text-[10px] font-bold"><Plus className="w-3 h-3" /> Add chapter</span>
          </div>
          {modules.map((m) => (
            <div key={m.name} className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-2.5">
              <div className="flex items-center gap-2">
                <GripVertical className="w-3.5 h-3.5 text-surface-400" />
                <span className="text-xs font-semibold text-surface-900 dark:text-white">{m.name}</span>
              </div>
              {m.open && (
                <div className="mt-2 pl-5 flex flex-wrap gap-1.5">
                  {m.items.map((it) => (
                    <span key={it} className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[10px] font-medium text-surface-600 dark:text-surface-300">{it}</span>
                  ))}
                  <span className="px-2 py-0.5 rounded-md border border-dashed border-surface-300 dark:border-surface-700 text-[10px] font-medium text-primary-600 flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" /> Add</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------------------------------------------------------------- */
/* 6. Admin — test & question bank builder preview                  */
/* ---------------------------------------------------------------- */
function TestBuilderPreview() {
  const qtypes = ["MCQ", "Numerical", "Assertion", "Match", "Image-based"];
  return (
    <BrowserFrame path="business.your-institute.com/admin/mock-tests/builder">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Add question</span>
          <span className="flex items-center gap-1 text-[10px] text-surface-500"><FileQuestion className="w-3.5 h-3.5" /> Question bank · 1,240</span>
        </div>
        {/* question type chips */}
        <div className="flex flex-wrap gap-1.5">
          {qtypes.map((q, i) => (
            <span key={q} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${i === 0 ? "bg-primary-600 text-white" : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300"}`}>{q}</span>
          ))}
        </div>
        {/* question editor */}
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 space-y-2">
          <div className="h-2.5 w-full rounded bg-surface-200 dark:bg-surface-800" />
          <div className="h-2.5 w-3/5 rounded bg-surface-200 dark:bg-surface-800" />
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${i === 2 ? "border-success-400 bg-success-50 dark:bg-success-900/20" : "border-surface-200 dark:border-surface-800"}`}>
                <span className={`w-3.5 h-3.5 rounded-full border-2 ${i === 2 ? "border-success-500 bg-success-500" : "border-surface-300 dark:border-surface-600"}`} />
                <span className="h-2 flex-1 rounded bg-surface-200 dark:bg-surface-800" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1 text-[10px] text-surface-500">
            <span className="px-2 py-0.5 rounded bg-success-100 dark:bg-success-900/30 text-success-700 font-semibold">+4 marks</span>
            <span className="px-2 py-0.5 rounded bg-error-100 dark:bg-error-900/30 text-error-700 font-semibold">−1 negative</span>
            <span className="ml-auto px-2 py-0.5 rounded bg-primary-600 text-white font-bold">Save</span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------------------------------------------------------------- */
/* 7. Admin — management console preview                            */
/* ---------------------------------------------------------------- */
function ManagementPreview() {
  const requests = [
    { name: "Enrollment · JEE 2027 batch", tone: "warning", action: "Approve" },
    { name: "Enrollment · NEET foundation", tone: "warning", action: "Approve" },
  ];
  return (
    <BrowserFrame path="business.your-institute.com/admin">
      <div className="space-y-3">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Users, label: "Students", v: "312", c: "text-primary-600 bg-primary-100 dark:bg-primary-900/30" },
            { icon: UserCheck, label: "Pending", v: "6", c: "text-warning-600 bg-warning-100 dark:bg-warning-900/30" },
            { icon: Sliders, label: "Courses", v: "18", c: "text-accent-600 bg-accent-100 dark:bg-accent-900/30" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${s.c}`}><s.icon className="w-3.5 h-3.5" /></div>
              <div className="text-sm font-bold text-surface-900 dark:text-white">{s.v}</div>
              <div className="text-[10px] text-surface-500">{s.label}</div>
            </div>
          ))}
        </div>
        {/* approval queue */}
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3">
          <div className="text-[10px] font-bold text-surface-500 uppercase mb-2">Enrollment requests</div>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.name} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 text-[10px] font-bold">S</span>
                <span className="text-[11px] text-surface-700 dark:text-surface-300 flex-1 truncate">{r.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-success-500 text-white text-[10px] font-bold">{r.action}</span>
                <span className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-500 text-[10px] font-bold">Deny</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------------------------------------------------------------- */
/* Showcase row                                                     */
/* ---------------------------------------------------------------- */
function ShowcaseRow({
  eyebrow,
  title,
  desc,
  points,
  preview,
  reverse,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  points: string[];
  preview: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
      <Reveal className={reverse ? "lg:order-2" : ""}>
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-4">
            {eyebrow}
          </span>
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 dark:text-white mb-3">{title}</h3>
          <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-6">{desc}</p>
          <ul className="space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="text-surface-700 dark:text-surface-300 text-sm font-medium">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
      <Reveal index={1} className={reverse ? "lg:order-1" : ""}>
        {preview}
      </Reveal>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Main section                                                     */
/* ---------------------------------------------------------------- */
export default function ProductTour() {
  return (
    <section id="tour" className="py-24 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-4">
            See it in action
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
            A glimpse of your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">
              branded student portal
            </span>
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400">
            An <span className="font-semibold text-surface-800 dark:text-surface-200">AI-powered LMS</span> for exam-prep,
            coding and skill-development courses — with AI doubt resolution, live classes, mock tests, coding labs,
            assignments, gamified leaderboards and analytics. Every screen runs on your own domain, in your colors,
            with a modern UI students love.
          </p>
        </div>

        <div className="space-y-20">
          <ShowcaseRow
            eyebrow="Student dashboard"
            title="A home screen that keeps students coming back"
            desc="Streaks, XP and levels turn daily practice into a habit. Students jump straight into their enrolled courses, see today's goal, and track their own progress at a glance."
            points={[
              "Daily streaks, XP and levels that reward consistency",
              "Quick access to enrolled courses with a swipeable slider",
              "Personal accuracy, study-time and goal tracking",
            ]}
            preview={<DashboardPreview />}
          />

          <ShowcaseRow
            reverse
            eyebrow="AI Tutor · doubt resolution"
            title="An AI tutor that clears doubts 24/7"
            desc="Students never stay stuck. Your branded AI tutor answers questions instantly with step-by-step explanations, worked examples and formulas — turning every doubt into a learning moment, day or night."
            points={[
              "Instant, step-by-step answers to any doubt, 24/7",
              "Context-aware help tied to your courses and content",
              "Frees up faculty time while students keep progressing",
            ]}
            preview={<AITutorPreview />}
          />

          <ShowcaseRow
            eyebrow="Rich mock tests"
            title="Full exam-hall experience, auto-graded instantly"
            desc="Timed, sectioned mock tests with a real question palette, mark-for-review, instructions and resume-on-refresh. Students get instant scores and detailed solutions; you get every submission."
            points={[
              "Live timer, question palette and mark-for-review",
              "Resume a paused attempt and control re-attempt limits",
              "Instant auto-grading with detailed, per-question solutions",
            ]}
            preview={<MockTestPreview />}
          />

          <ShowcaseRow
            reverse
            eyebrow="Coding & auto-evaluation"
            title="Practice code, judged automatically"
            desc="Run a full coding lab inside your portal. Students write and run code against sample and hidden test cases, and every submission is auto-evaluated with an instant verdict, runtime and memory — no manual checking."
            points={[
              "In-browser editor with run and submit",
              "Auto-graded against sample, edge and hidden test cases",
              "Instant verdict with runtime and memory feedback",
            ]}
            preview={<CodingPreview />}
          />

          <ShowcaseRow
            eyebrow="Assignments & homework"
            title="Set homework, collect it, grade it — in one place"
            desc="Assign problem sets and worksheets to a batch, track who has submitted, and return grades with written feedback. Students always know what's due and where they stand."
            points={[
              "Per-batch assignments with due dates and reminders",
              "Submission tracking — submitted, pending and late",
              "Grades with written teacher feedback students can see",
            ]}
            preview={<AssignmentPreview />}
          />

          <ShowcaseRow
            reverse
            eyebrow="Leaderboards & gamification"
            title="Turn learning into a game they want to win"
            desc="XP, levels, streaks, badges and weekly leaderboards tap into healthy competition — keeping students motivated, consistent and coming back to your portal every single day."
            points={[
              "Weekly and all-time leaderboards across your batches",
              "XP, levels, streaks and unlockable achievement badges",
              "Motivation that measurably lifts daily active learning",
            ]}
            preview={<LeaderboardPreview />}
          />

          <ShowcaseRow
            eyebrow="Live classes & community"
            title="Bring your batch together, online"
            desc="Schedule live classes and events students can join in a click, and run moderated discussion spaces where they ask doubts, help each other and stay engaged between sessions."
            points={[
              "Live class events with join links and reminders",
              "Course-filtered discussion feeds with upvotes and replies",
              "Admin moderation — hide, restore and manage posts",
            ]}
            preview={<CommunityPreview />}
          />

          <ShowcaseRow
            reverse
            eyebrow="Analytics & skill mastery"
            title="See exactly where every student stands"
            desc="Real-time dashboards reveal accuracy, speed and topic-wise mastery for each student and whole batches — so teaching stays targeted and improvement is measurable."
            points={[
              "Accuracy and attempt trends over time",
              "Topic and skill mastery, strengths and gaps",
              "Individual and batch-level insights in real time",
            ]}
            preview={<AnalyticsPreview />}
          />
        </div>

        {/* Admin / teacher sub-section */}
        <div className="text-center max-w-3xl mx-auto mt-24 mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-xs font-bold uppercase tracking-wider mb-4">
            For your team
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
            A powerful{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-primary-500">
              admin &amp; teacher back-office
            </span>
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400">
            Build courses, author tests and manage your whole institute — no coding, no
            spreadsheets, no separate tools.
          </p>
        </div>

        <div className="space-y-20">
          <ShowcaseRow
            eyebrow="Course builder"
            title="Build a full course in minutes — no code"
            desc="Create courses with a drag-and-drop curriculum, add notes, videos, quizzes, assignments and mock tests to each chapter, upload a cover thumbnail, and publish when you're ready."
            points={[
              "Drag-and-drop chapters and lessons",
              "Mix notes, videos, quizzes, homework and tests",
              "Cover thumbnails, drafts and one-click publish",
            ]}
            preview={<CourseBuilderPreview />}
          />

          <ShowcaseRow
            reverse
            eyebrow="Test & question bank"
            title="Author exams from a reusable question bank"
            desc="Add MCQ, numerical, assertion-reason, match and image-based questions, set marks and negative marking, organize them into sections, and reuse them across tests and quizzes."
            points={[
              "Five question types with rich content and images",
              "Custom marks, negative marking and sections",
              "Reusable bank across tests, quizzes and batches",
            ]}
            preview={<TestBuilderPreview />}
          />

          <ShowcaseRow
            eyebrow="Management console"
            title="Run the whole institute from one place"
            desc="Approve enrollment requests, manage students and batches, review mock-test submissions, moderate the community, and suspend or restore accounts — all with role-based access for your team."
            points={[
              "One-click enrollment approvals and student management",
              "Review submissions and moderate community posts",
              "Role-based access for admins, faculty and staff",
            ]}
            preview={<ManagementPreview />}
          />
        </div>

        {/* trust strip */}
        <Reveal>
          <div className="mt-20 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-surface-500">
            <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary-500" /> Course catalog with thumbnails &amp; named faculty</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-success-500" /> Secure, email-verified student onboarding</span>
            <span className="flex items-center gap-2"><Bookmark className="w-4 h-4 text-accent-500" /> Enroll on request with admin approval</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
