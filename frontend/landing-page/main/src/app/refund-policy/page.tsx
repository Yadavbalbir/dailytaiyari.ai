import type { Metadata } from "next";
import LegalShell, { LegalSection } from "@/components/institutes/LegalShell";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "DailyTaiyari's policy on subscription cancellations, refunds and free trials.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicy() {
  return (
    <LegalShell
      title="Refund & Cancellation Policy"
      updated="10 July 2026"
      intro="We want you to be confident in choosing DailyTaiyari. This policy explains how cancellations, refunds and free trials work."
    >
      <LegalSection heading="1. Free trial">
        <p>
          New institutes can try DailyTaiyari free for 14 days, with no credit card
          required to start. You will only be charged if you choose to continue on a
          paid plan after the trial ends.
        </p>
      </LegalSection>

      <LegalSection heading="2. Cancellations">
        <p>
          You can cancel your subscription at any time from your account or by
          contacting us. When you cancel, your plan remains active until the end of
          the current billing period, after which it will not renew.
        </p>
      </LegalSection>

      <LegalSection heading="3. Refunds">
        <p>
          Monthly subscriptions are non-refundable for the current billing month once
          charged. For annual subscriptions, you may request a pro-rated refund of the
          unused whole months within 30 days of the charge, less any usage-based
          charges already incurred.
        </p>
        <p>
          Usage-based AI charges and one-time setup or onboarding fees are
          non-refundable, as they reflect services already delivered.
        </p>
      </LegalSection>

      <LegalSection heading="4. How to request a refund">
        <p>
          To request a refund, email hello@dailytaiyari.in from your registered
          address with your institute name and invoice reference. Approved refunds are
          processed to the original payment method within 7–10 business days.
        </p>
      </LegalSection>

      <LegalSection heading="5. Exceptions">
        <p>
          Refunds may be declined in cases of breach of our Terms of Service, abuse of
          the platform, or where a custom or enterprise agreement specifies different
          terms. Enterprise contracts are governed by their individual agreements.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
