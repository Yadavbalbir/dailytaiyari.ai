import Link from "next/link";

const columns = [
  {
    title: "Platform",
    links: [
      { name: "Who it's for", href: "#audience" },
      { name: "Features", href: "#features" },
      { name: "How it works", href: "#how" },
      { name: "Why grow with us", href: "#grow" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { name: "Coaching Institutes", href: "#audience" },
      { name: "Schools", href: "#audience" },
      { name: "Colleges", href: "#audience" },
      { name: "Offline batch tracking", href: "#features" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "FAQ", href: "#faq" },
      { name: "Book a Demo", href: "#demo" },
      { name: "Contact us", href: "mailto:hello@dailytaiyari.in" },
    ],
  },
];

export default function InstituteFooter() {
  return (
    <footer className="bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">dt</span>
              </div>
              <span className="font-display font-bold text-xl">DailyTaiyari</span>
            </div>
            <p className="text-surface-600 dark:text-surface-400 text-sm max-w-sm">
              The white-label EdTech platform that helps coaching institutes, schools and colleges
              go digital — on their own domain, with real-time performance and skill tracking.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-4">{col.title}</h4>
              <ul className="space-y-3 text-sm text-surface-600 dark:text-surface-400">
                {col.links.map((l) => (
                  <li key={l.name}>
                    <Link href={l.href} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-500">
            © {new Date().getFullYear()} DailyTaiyari. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-surface-500 text-sm">
            <a href="#" className="hover:text-primary-600 transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary-600 transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-primary-600 transition-colors">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
