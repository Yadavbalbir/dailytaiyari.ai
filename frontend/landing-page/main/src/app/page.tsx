import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ExamProgramsSection from '@/components/ExamProgramsSection';
import SkillProgramsSection from '@/components/SkillProgramsSection';
import WhyChooseUsSection from '@/components/WhyChooseUsSection';
import FeaturesSection from '@/components/FeaturesSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import MentorsSection from '@/components/MentorsSection';
import ResultsSection from '@/components/ResultsSection';
import FAQSection from '@/components/FAQSection';
import CTASection from '@/components/CTASection';
import Link from 'next/link';
import { ArrowRight, Star, Users, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-surface-50 dark:bg-surface-950 pt-20 pb-32">
          {/* Background Decorations */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full flex justify-between pointer-events-none opacity-20 dark:opacity-10">
            <div className="w-96 h-96 bg-primary-400 rounded-full blur-[100px] -ml-40 -mt-20"></div>
            <div className="w-96 h-96 bg-accent-400 rounded-full blur-[100px] -mr-40 mt-40"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="text-center lg:text-left flex flex-col items-center lg:items-start space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-sm animate-fade-in">
                  <Star className="w-4 h-4 fill-current" />
                  <span>India's #1 Ed-Tech Platform</span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-display font-bold leading-tight text-surface-900 dark:text-white">
                  Crack Exams & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">Master Skills</span> With Top Mentors
                </h1>

                <p className="text-lg lg:text-xl text-surface-600 dark:text-surface-400 max-w-2xl bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm rounded-xl py-2">
                  DailyTaiyari offers Live Classes, recorded lectures, 1:1 mentorship for IIT-JEE, NEET, NDA, and premium Cohort-Based Skill Training for budding developers.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link href="/signup" className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-glow transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto">
                    Start Learning Free <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/programs/jee" className="px-8 py-4 bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 hover:border-primary-500 text-surface-900 dark:text-white rounded-xl font-bold text-lg transition-all hover:scale-105 w-full sm:w-auto text-center">
                    Explore Courses
                  </Link>
                </div>

                {/* Social Proof */}
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex -space-x-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-white dark:border-surface-950 bg-gradient-to-br from-primary-200 to-accent-200 flex justify-center items-center">
                        <span className="text-surface-600 font-bold text-sm">S{i}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex text-warning-400">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                    </div>
                    <p className="text-surface-600 dark:text-surface-400 font-medium mt-1">
                      Trusted by <span className="font-bold text-surface-900 dark:text-white">100k+</span> students
                    </p>
                  </div>
                </div>
              </div>

              {/* Hero Image/Card */}
              <div className="relative mx-auto w-full max-w-lg lg:max-w-none animate-float">
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative bg-gradient-to-tr from-surface-100 to-surface-50 dark:from-surface-900 dark:to-surface-800 border border-surface-200 dark:border-surface-700">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center mix-blend-overlay opacity-40 dark:opacity-20"></div>

                  {/* Floating Elements on Top of Image */}
                  <div className="absolute top-8 left-8 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700 flex items-center gap-4">
                    <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-surface-900 dark:text-white text-lg">99.9%ile</p>
                      <p className="text-surface-500 text-sm">Highest Score JEE</p>
                    </div>
                  </div>

                  <div className="absolute bottom-8 right-8 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700 flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-surface-900 dark:text-white text-lg">Live Classes</p>
                      <p className="text-surface-500 text-sm">Interactive learning</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ExamProgramsSection />
        <SkillProgramsSection />
        <WhyChooseUsSection />
        <FeaturesSection />
        <MentorsSection />
        <ResultsSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />

      </main>
      <Footer />
    </>
  );
}
