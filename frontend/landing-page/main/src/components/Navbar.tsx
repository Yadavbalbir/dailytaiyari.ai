"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const programCategories = [
    {
      title: 'Exam Prep',
      items: [
        { name: 'IIT-JEE', href: '/programs/jee' },
        { name: 'NEET', href: '/programs/neet' },
        { name: 'NDA', href: '/programs/nda' },
      ]
    },
    {
      title: 'Skill Training',
      items: [
        { name: 'Web Development', href: '/skills/web-dev' },
        { name: 'AI & Machine Learning', href: '/skills/ai-ml' },
        { name: 'Interview Prep', href: '/skills/interview' },
      ]
    }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-lg border-b border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">dt</span>
              </div>
              <span className="font-display font-bold text-xl hidden sm:block">DailyTaiyari</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="relative group">
              <button className="flex items-center gap-1 text-surface-600 hover:text-primary-600 dark:text-surface-300 dark:hover:text-primary-400 font-medium transition-colors">
                Programs <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex">
                {programCategories.map((cat, idx) => (
                  <div key={idx} className={`p-4 flex-1 ${idx === 0 ? 'border-r border-surface-100 dark:border-surface-700' : ''}`}>
                    <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">{cat.title}</p>
                    {cat.items.map((p) => (
                      <Link key={p.name} href={p.href} className="block py-1 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors">
                        {p.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <Link href="#features" className="text-surface-600 hover:text-primary-600 dark:text-surface-300 dark:hover:text-primary-400 font-medium transition-colors">Features</Link>
            <Link href="#mentors" className="text-surface-600 hover:text-primary-600 dark:text-surface-300 dark:hover:text-primary-400 font-medium transition-colors">Mentors</Link>
            <Link href="#results" className="text-surface-600 hover:text-primary-600 dark:text-surface-300 dark:hover:text-primary-400 font-medium transition-colors">Results</Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-surface-600 hover:text-primary-600 dark:text-surface-300 font-medium">Log in</Link>
            <Link href="/signup" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-glow transition-all hover:scale-105 active:scale-95">
              Start Free Trial
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-surface-600 hover:text-primary-600 dark:text-surface-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white/95 dark:bg-surface-900/95 border-b border-surface-200 dark:border-surface-800"
          >
            <div className="px-4 py-4 space-y-4">
              <div className="space-y-4">
                {programCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="px-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">{cat.title}</p>
                    {cat.items.map((p) => (
                      <Link key={p.name} href={p.href} className="block px-2 py-1.5 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-sm">
                        {p.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
              <Link href="#features" className="block px-2 py-2 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800">Features</Link>
              <Link href="#results" className="block px-2 py-2 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800">Results</Link>
              <div className="pt-4 flex flex-col gap-3">
                <Link href="/login" className="w-full px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-xl text-center font-medium">Log in</Link>
                <Link href="/signup" className="w-full px-4 py-2 bg-primary-600 text-white rounded-xl text-center font-semibold">Start Free Trial</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
