import Link from "next/link";
import { Code, Terminal, Bot, ArrowRight } from "lucide-react";

export default function SkillProgramsSection() {
    const skills = [
        {
            title: "Full-Stack Web Dev",
            description: "Project-based cohort learning MERN stack, Next.js, and system design with 100% placement assistance.",
            icon: <Code className="w-8 h-8 text-warning-500" />,
            color: "from-warning-500 to-yellow-400",
            bgHover: "hover:border-warning-400"
        },
        {
            title: "Applied AI & GenAI",
            description: "Master LLMs, machine learning models, and build robust AI applications from scratch.",
            icon: <Bot className="w-8 h-8 text-accent-500" />,
            color: "from-accent-500 to-indigo-400",
            bgHover: "hover:border-accent-500"
        },
        {
            title: "Python Data Mastery",
            description: "End-to-end Python programming for data science, automation, and backend engineering.",
            icon: <Terminal className="w-8 h-8 text-success-500" />,
            color: "from-success-500 to-green-400",
            bgHover: "hover:border-success-400"
        }
    ];

    return (
        <section id="skill-programs" className="py-24 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
                        Master <span className="text-warning-500">In-Demand Skills</span>
                    </h2>
                    <p className="text-lg text-surface-600 dark:text-surface-400">
                        Level up your career with our project-based cohorts focusing on modern technologies, coding, and placements.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {skills.map((skill, idx) => (
                        <div key={idx} className={`p-8 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 transition-all duration-300 transform hover:-translate-y-2 hover:border-warning-400 ${skill.bgHover}`}>
                            <div className="w-16 h-16 rounded-2xl bg-surface-50 dark:bg-surface-800 shadow-sm flex items-center justify-center mb-6 border border-surface-100 dark:border-surface-700">
                                {skill.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">{skill.title}</h3>
                            <p className="text-surface-600 dark:text-surface-400 mb-6 flex-1">
                                {skill.description}
                            </p>
                            <ul className="mb-8 space-y-2">
                                {['10+ Live Projects', 'Placement Assistance', 'Industry Mentors'].map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-center text-sm text-surface-700 dark:text-surface-300 font-medium">
                                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${skill.color} mr-3`}></span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/skills" className="inline-flex items-center gap-2 text-warning-600 dark:text-warning-400 font-semibold hover:text-warning-700 dark:hover:text-warning-300 group transition-colors">
                                View Curriculum <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
