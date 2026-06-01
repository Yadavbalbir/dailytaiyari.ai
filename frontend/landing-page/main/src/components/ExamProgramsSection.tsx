import Link from "next/link";
import { BookOpen, Target, Shield, ArrowRight } from "lucide-react";

export default function ExamProgramsSection() {
    const courses = [
        {
            title: "IIT-JEE (Main + Advanced)",
            description: "Comprehensive preparation covering class 11th & 12th syllabus with top-tier faculty and daily practice papers.",
            icon: <Target className="w-8 h-8 text-primary-500" />,
            color: "from-primary-500 to-orange-400",
            bgHover: "hover:shadow-glow"
        },
        {
            title: "NEET UG",
            description: "Expert-led medical entrance coaching with extensive test series, NCERT focus, and 1:1 mentor support.",
            icon: <BookOpen className="w-8 h-8 text-success-500" />,
            color: "from-success-500 to-emerald-400",
            bgHover: "hover:border-success-200"
        },
        {
            title: "NDA & Defence",
            description: "Structured program focusing on Mathematics and GAT, combined with SSB Interview guidance.",
            icon: <Shield className="w-8 h-8 text-accent-500" />,
            color: "from-accent-500 to-purple-400",
            bgHover: "hover:border-accent-500"
        }
    ];

    return (
        <section id="exam-programs" className="py-24 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
                        Elite <span className="text-primary-600">Exam Preparation</span>
                    </h2>
                    <p className="text-lg text-surface-600 dark:text-surface-400">
                        Choose from our highly structured, result-oriented courses designed by India's top educators to help you ace competitive exams.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {courses.map((course, idx) => (
                        <div key={idx} className={`p-8 rounded-3xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 transition-all duration-300 transform hover:-translate-y-2 hover:border-primary-400 ${course.bgHover}`}>
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-surface-800 shadow-sm flex items-center justify-center mb-6">
                                {course.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">{course.title}</h3>
                            <p className="text-surface-600 dark:text-surface-400 mb-6 flex-1">
                                {course.description}
                            </p>
                            <ul className="mb-8 space-y-2">
                                {['Live Classes', 'Test Series', '1:1 Mentorship'].map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-center text-sm text-surface-700 dark:text-surface-300 font-medium">
                                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${course.color} mr-3`}></span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/programs" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 group transition-colors">
                                Explore Details <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
