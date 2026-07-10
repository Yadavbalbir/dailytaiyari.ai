// Public platform lead helpers (demo bookings + contact messages).
// These call the DailyTaiyari backend directly — NO tenant header, no auth.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://api.dailytaiyari.in/api/v1";

export const LEAD_EVENT = "dt:open-lead";
export type LeadKind = "demo" | "contact";

/** Optional context describing where/why the lead was opened (e.g. a pricing plan). */
export interface LeadContext {
  plan?: string;
  source?: string;
}

export interface LeadEventDetail {
  kind: LeadKind;
  context?: LeadContext;
}

/** Open the demo / contact dialog from anywhere on the page. */
export function openLeadDialog(kind: LeadKind, context?: LeadContext) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LeadEventDetail>(LEAD_EVENT, { detail: { kind, context } })
  );
}

export interface DemoBookingPayload {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  organization_type?: string;
  message?: string;
  source?: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  source?: string;
}

export interface JobApplicationPayload {
  name: string;
  email: string;
  phone?: string;
  position: string;
  experience?: string;
  portfolio_url?: string;
  cover_letter?: string;
  source?: string;
}

async function postLead(path: string, payload: object) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "landing", ...payload }),
  });
  if (!res.ok) {
    let detail = "Something went wrong. Please try again.";
    try {
      const data = await res.json();
      const first = Object.values(data)[0];
      if (typeof first === "string") detail = first;
      else if (Array.isArray(first) && first.length) detail = String(first[0]);
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }
  return res.json();
}

export function submitDemoBooking(payload: DemoBookingPayload) {
  return postLead("/platform/demo-bookings/", payload);
}

export function submitContactMessage(payload: ContactMessagePayload) {
  return postLead("/platform/contact-messages/", payload);
}

export function submitJobApplication(payload: JobApplicationPayload) {
  return postLead("/platform/job-applications/", payload);
}
