import type { Metadata } from "next";
import LegalShell, { LegalSection } from "@/components/institutes/LegalShell";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How DailyTaiyari uses cookies and similar technologies.",
  alternates: { canonical: "/cookie-policy" },
};

export default function CookiePolicy() {
  return (
    <LegalShell
      title="Cookie Policy"
      updated="10 July 2026"
      intro="This Cookie Policy explains how DailyTaiyari uses cookies and similar technologies to recognise you when you visit our website and platform."
    >
      <LegalSection heading="1. What are cookies?">
        <p>
          Cookies are small text files stored on your device when you visit a
          website. They help the site remember your actions and preferences over
          time.
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use cookies">
        <p>
          We use essential cookies to operate the platform and keep you signed in,
          preference cookies to remember your settings, and analytics cookies to
          understand how the site is used so we can improve it.
        </p>
      </LegalSection>

      <LegalSection heading="3. Managing cookies">
        <p>
          You can control and delete cookies through your browser settings.
          Disabling some cookies may affect the functionality of the platform.
        </p>
      </LegalSection>

      <LegalSection heading="4. Changes">
        <p>
          We may update this policy as our use of cookies evolves. The “last
          updated” date above reflects the latest revision.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
