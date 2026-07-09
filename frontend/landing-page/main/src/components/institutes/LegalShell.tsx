import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InstituteNav from "./InstituteNav";
import InstituteFooter from "./InstituteFooter";

export default function LegalShell({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <InstituteNav />
      <main className="flex-1 bg-white dark:bg-surface-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:gap-3 transition-all mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <h1 className="text-3xl sm:text-4xl font-display font-bold text-surface-900 dark:text-white mb-3">
            {title}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-10">
            Last updated: {updated}
          </p>

          {intro && (
            <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed mb-10">
              {intro}
            </p>
          )}

          <div className="prose-legal space-y-8">{children}</div>

          <div className="mt-16 pt-8 border-t border-surface-200 dark:border-surface-800 text-sm text-surface-500 dark:text-surface-400">
            Questions about this policy? Email us at{" "}
            <a
              href="mailto:hello@dailytaiyari.in"
              className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              hello@dailytaiyari.in
            </a>
            .
          </div>
        </div>
      </main>
      <InstituteFooter />
    </>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-3">
        {heading}
      </h2>
      <div className="space-y-3 text-surface-600 dark:text-surface-300 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
