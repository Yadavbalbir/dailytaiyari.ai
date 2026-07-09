import type { Metadata } from "next";
import LegalShell, { LegalSection } from "@/components/institutes/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How DailyTaiyari collects, uses, stores and protects the personal data of institutes and their students.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicy() {
  return (
    <LegalShell
      title="Privacy Policy"
      updated="10 July 2026"
      intro="DailyTaiyari (“we”, “us”, “our”) is committed to protecting the privacy of the institutes we serve and their students. This policy explains what information we collect, how we use it, and the choices you have."
    >
      <LegalSection heading="1. Information we collect">
        <p>
          We collect information you provide directly — such as your name, email,
          phone number, institute details and any content you upload — as well as
          information collected automatically, such as device data, IP address,
          browser type and usage analytics.
        </p>
        <p>
          When you request a demo or contact us, we store the details you submit so
          we can respond to your enquiry.
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use your information">
        <p>
          We use your information to provide and improve the platform, set up and
          operate your branded portal, process payments, provide support,
          communicate service updates, and comply with legal obligations.
        </p>
      </LegalSection>

      <LegalSection heading="3. Student data & your role">
        <p>
          For data belonging to your students, your institute is the data
          controller and DailyTaiyari acts as a data processor. We process student
          data only to provide the service to you and under your instructions.
        </p>
      </LegalSection>

      <LegalSection heading="4. Data sharing">
        <p>
          We do not sell your personal data. We share it only with trusted service
          providers (for example, cloud hosting, email and payment processors) who
          process it on our behalf, and where required by law.
        </p>
      </LegalSection>

      <LegalSection heading="5. Data security & retention">
        <p>
          We use industry-standard security measures to protect your data and
          retain it only as long as necessary to provide the service or as required
          by law. You may request deletion of your data subject to legal and
          contractual limits.
        </p>
      </LegalSection>

      <LegalSection heading="6. Your rights">
        <p>
          Subject to applicable law, you may access, correct, export or delete your
          personal data, and object to or restrict certain processing. To exercise
          these rights, contact us at hello@dailytaiyari.in.
        </p>
      </LegalSection>

      <LegalSection heading="7. Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will be
          notified via the platform or email, and the “last updated” date above
          will reflect the latest revision.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
