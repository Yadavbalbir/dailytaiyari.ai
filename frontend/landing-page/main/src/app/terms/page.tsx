import type { Metadata } from "next";
import LegalShell, { LegalSection } from "@/components/institutes/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions governing your use of the DailyTaiyari platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsOfService() {
  return (
    <LegalShell
      title="Terms of Service"
      updated="10 July 2026"
      intro="These Terms of Service (“Terms”) govern your access to and use of the DailyTaiyari platform. By using the platform, you agree to these Terms."
    >
      <LegalSection heading="1. The service">
        <p>
          DailyTaiyari provides a white-label learning management platform that lets
          institutes host courses, tests, content and analytics under their own
          brand. Features available to you depend on your subscription plan.
        </p>
      </LegalSection>

      <LegalSection heading="2. Accounts & eligibility">
        <p>
          You are responsible for maintaining the confidentiality of your account
          credentials and for all activity under your account. You must provide
          accurate information and be authorised to represent your institute.
        </p>
      </LegalSection>

      <LegalSection heading="3. Subscriptions & billing">
        <p>
          Paid plans are billed on a per-student basis, monthly or annually as
          selected. AI-powered features are billed separately on a usage basis.
          Fees are exclusive of applicable taxes unless stated otherwise.
        </p>
        <p>
          Unless cancelled, subscriptions renew automatically at the end of each
          billing period at the then-current rates.
        </p>
      </LegalSection>

      <LegalSection heading="4. Your content">
        <p>
          You retain ownership of the content you and your students upload. You grant
          us a limited licence to host and process that content solely to provide the
          service. You are responsible for ensuring your content is lawful and does
          not infringe third-party rights.
        </p>
      </LegalSection>

      <LegalSection heading="5. Acceptable use">
        <p>
          You agree not to misuse the platform, including by attempting to breach
          security, reverse-engineer the software, resell the service without
          authorisation, or upload unlawful, harmful or infringing content.
        </p>
      </LegalSection>

      <LegalSection heading="6. Availability & support">
        <p>
          We work to keep the platform available and reliable, but do not guarantee
          uninterrupted service. Planned maintenance and support levels may vary by
          plan.
        </p>
      </LegalSection>

      <LegalSection heading="7. Limitation of liability">
        <p>
          To the maximum extent permitted by law, DailyTaiyari is not liable for
          indirect, incidental or consequential damages, and our total liability is
          limited to the fees you paid in the twelve months preceding the claim.
        </p>
      </LegalSection>

      <LegalSection heading="8. Termination">
        <p>
          You may cancel at any time. We may suspend or terminate access for breach
          of these Terms. On termination, you may export your data within a
          reasonable period, after which it may be deleted.
        </p>
      </LegalSection>

      <LegalSection heading="9. Changes to these Terms">
        <p>
          We may update these Terms from time to time. Continued use of the platform
          after changes take effect constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
