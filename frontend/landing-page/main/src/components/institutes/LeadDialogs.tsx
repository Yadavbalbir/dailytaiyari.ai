"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Loader2, GraduationCap, MessageSquare, Sparkles } from "lucide-react";
import {
  LEAD_EVENT,
  type LeadEventDetail,
  type LeadContext,
  type LeadKind,
  submitDemoBooking,
  submitContactMessage,
} from "@/lib/leads";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";
const labelClass =
  "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";

export default function LeadDialogs() {
  const [kind, setKind] = useState<LeadKind | null>(null);
  const [context, setContext] = useState<LeadContext | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const close = useCallback(() => {
    setKind(null);
    setContext(null);
    setStatus("idle");
    setErrorMsg("");
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LeadEventDetail>).detail;
      setStatus("idle");
      setErrorMsg("");
      setContext(detail?.context ?? null);
      setKind(detail?.kind ?? null);
    };
    window.addEventListener(LEAD_EVENT, handler);
    return () => window.removeEventListener(LEAD_EVENT, handler);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    if (kind) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [kind, close]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setStatus("submitting");
    setErrorMsg("");

    // Fold any lead context (e.g. a pricing plan) into the payload so the
    // team gets a clear heads-up that this is a purchase-intent lead.
    const source = context?.source
      ? `landing-${context.source.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`
      : "landing";
    const heads = context?.plan
      ? `🔥 SALES LEAD — interested in the ${context.plan} plan${
          context.source ? ` (from ${context.source})` : ""
        }.`
      : "";
    const withHeads = (msg?: string) =>
      heads ? (msg ? `${heads}\n\n${msg}` : heads) : msg;

    try {
      if (kind === "demo") {
        await submitDemoBooking({
          name: data.name,
          email: data.email,
          phone: data.phone,
          organization: data.organization,
          organization_type: data.organization_type,
          message: withHeads(data.message),
          source,
        });
      } else {
        await submitContactMessage({
          name: data.name,
          email: data.email,
          subject: context?.plan
            ? `[Sales] ${context.plan} plan — ${data.subject || "Pricing enquiry"}`
            : data.subject,
          message: withHeads(data.message) ?? data.message,
          source,
        });
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const isDemo = kind === "demo";

  return (
    <AnimatePresence>
      {kind && (
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
                    {isDemo ? "Demo request received!" : "Message sent!"}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 mb-6">
                    Thanks for reaching out. Our team will get back to you shortly.
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
                      {isDemo ? <GraduationCap className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                    </div>
                    <h3 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                      {isDemo ? "Book a demo" : "Talk to us"}
                    </h3>
                  </div>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 ml-[3.25rem]">
                    {isDemo
                      ? "Tell us about your institute and we'll reach out to schedule a walkthrough."
                      : "Send us a message and we'll get back to you soon."}
                  </p>

                  {context?.plan && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 text-sm">
                      <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                      <span className="text-surface-700 dark:text-surface-200">
                        You're enquiring about the{" "}
                        <span className="font-bold text-primary-700 dark:text-primary-300">
                          {context.plan}
                        </span>{" "}
                        plan{context.source ? ` · from ${context.source}` : ""}
                      </span>
                    </div>
                  )}

                  <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass} htmlFor="lead-name">Name *</label>
                        <input id="lead-name" name="name" required minLength={2} className={inputClass} placeholder="Your full name" />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="lead-email">Email *</label>
                        <input id="lead-email" name="email" type="email" required className={inputClass} placeholder="you@example.com" />
                      </div>
                    </div>

                    {isDemo ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass} htmlFor="lead-phone">Phone</label>
                            <input id="lead-phone" name="phone" className={inputClass} placeholder="+91 " />
                          </div>
                          <div>
                            <label className={labelClass} htmlFor="lead-orgtype">Organization type</label>
                            <select id="lead-orgtype" name="organization_type" defaultValue="" className={inputClass}>
                              <option value="">Select…</option>
                              <option value="coaching">Coaching Institute</option>
                              <option value="school">School</option>
                              <option value="college">College</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="lead-org">Institute / organization name</label>
                          <input id="lead-org" name="organization" className={inputClass} placeholder="e.g. Bright Future Academy" />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="lead-msg">Anything you'd like us to know?</label>
                          <textarea id="lead-msg" name="message" rows={3} className={inputClass} placeholder="Your goals, number of students, etc." />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className={labelClass} htmlFor="lead-subject">Subject</label>
                          <input id="lead-subject" name="subject" className={inputClass} placeholder="What's this about?" />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="lead-cmsg">Message *</label>
                          <textarea id="lead-cmsg" name="message" required minLength={5} rows={4} className={inputClass} placeholder="How can we help?" />
                        </div>
                      </>
                    )}

                    {status === "error" && (
                      <p className="text-sm text-error-600 dark:text-error-400">{errorMsg}</p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-70 text-white rounded-xl font-bold shadow-glow transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                      {status === "submitting" ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</>
                      ) : isDemo ? (
                        "Request demo"
                      ) : (
                        "Send message"
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
  );
}
