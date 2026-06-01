import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
    return (
        <section className="py-24 relative overflow-hidden bg-primary-600 dark:bg-primary-900">
            {/* Background Ornaments */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent-500/20 rounded-full blur-2xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                    Ready to Start Your Success Journey?
                </h2>
                <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                    Join thousands of students who have cracked their dream exams with DailyTaiyari. Sign up today and get your first week absolutely free!
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/signup" className="px-8 py-4 bg-white text-primary-700 hover:bg-surface-50 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                        Start Free Trial <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link href="/contact" className="px-8 py-4 bg-primary-700/50 hover:bg-primary-800/80 border border-primary-500 text-white rounded-xl font-bold text-lg transition-all hover:-translate-y-1 flex items-center justify-center">
                        Talk to an Expert
                    </Link>
                </div>
            </div>
        </section>
    );
}
