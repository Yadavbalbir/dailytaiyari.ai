// Public platform lead helpers (demo bookings + contact messages).
// These call the DailyTaiyari backend directly — NO tenant header, no auth.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://api.dailytaiyari.in/api/v1";

export const LEAD_EVENT = "dt:open-lead";
export type LeadKind = "demo" | "contact";

/** Open the demo / contact dialog from anywhere on the page. */
export function openLeadDialog(kind: LeadKind) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<LeadKind>(LEAD_EVENT, { detail: kind }));
}

export interface DemoBookingPayload {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  organization_type?: string;
  message?: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

async function postLead(path: string, payload: object) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, source: "landing" }),
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
