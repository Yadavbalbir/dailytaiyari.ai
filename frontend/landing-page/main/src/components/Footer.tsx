import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">dt</span>
              </div>
              <span className="font-display font-bold text-xl">DailyTaiyari</span>
            </Link>
            <p className="text-surface-600 dark:text-surface-400 text-sm mb-6 max-w-sm">
              India's Premier Exam Preparation Platform. Prepare for IIT-JEE, NEET, NDA, and Foundations with top educators.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-white mb-4">Our Programs</h4>
            <ul className="space-y-3 text-sm text-surface-600 dark:text-surface-400">
              <li><Link href="/iit-jee" className="hover:text-primary-600 transition-colors">IIT-JEE Preparation</Link></li>
              <li><Link href="/neet" className="hover:text-primary-600 transition-colors">NEET Preparation</Link></li>
              <li><Link href="/skills/web-dev" className="hover:text-primary-600 transition-colors">Web Development</Link></li>
              <li><Link href="/skills/ai-ml" className="hover:text-primary-600 transition-colors">AI & Machine Learning</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-surface-600 dark:text-surface-400">
              <li><Link href="/about" className="hover:text-primary-600 transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-primary-600 transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-primary-600 transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-primary-600 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-surface-600 dark:text-surface-400">
              <li><Link href="/terms" className="hover:text-primary-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund" className="hover:text-primary-600 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-500">
            © {new Date().getFullYear()} DailyTaiyari. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-surface-500">
            {/* Social Icons Placeholders */}
            <a href="#" className="hover:text-primary-600 transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary-600 transition-colors">YouTube</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
