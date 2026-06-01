import { CheckCircle2 } from "lucide-react";

export default function WhyChooseUsSection() {
    const reasons = [
        {
            title: "1:1 Doubt Solving",
            description: "Connect instantly with top rankers and expert faculties to resolve your doubts.",
            highlight: "24/7 Availability"
        },
        {
            title: "Performance Analytics",
            description: "AI-driven insights to identify weak areas and track your daily progress over time.",
            highlight: "AI-Powered"
        },
        {
            title: "Online & Offline",
            description: "Seamlessly switch between our interactive online platform and physical study centers.",
            highlight: "Hybrid Model"
        },
        {
            title: "DPPs & Assignments",
            description: "Daily targeted practice problems to ensure conceptual clarity and exam readiness.",
            highlight: "10,000+ Qs"
        }
    ];

    return (
        <section id="why-us" className="py-24 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Content */}
                    <div>
                        <h2 className="text-4xl font-display font-bold text-surface-900 dark:text-white mb-6">
                            Why <span className="text-primary-600">Thousands</span> of Students Trust DailyTaiyari
                        </h2>
                        <p className="text-lg text-surface-600 dark:text-surface-400 mb-8">
                            We go beyond traditional teaching. Our hybrid coaching model combines the best offline study environment with cutting-edge online tools.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {reasons.map((reason, idx) => (
                                <div key={idx} className="bg-white dark:bg-surface-900 p-6 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <CheckCircle2 className="w-6 h-6 text-primary-500" />
                                        <span className="text-xs font-bold px-2 py-1 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 rounded-full">
                                            {reason.highlight}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-surface-900 dark:text-white text-lg mb-2">{reason.title}</h4>
                                    <p className="text-sm text-surface-600 dark:text-surface-400">{reason.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Visual */}
                    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-xl border-4 border-white dark:border-surface-800">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center"></div>
                        {/* Stats Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/90 via-surface-900/20 to-transparent flex items-end p-8">
                            <div className="text-white w-full">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-3xl font-bold text-primary-400">50+</p>
                                        <p className="text-xs font-medium uppercase tracking-wider mt-1 opacity-80">Centers</p>
                                    </div>
                                    <div className="border-x border-white/20">
                                        <p className="text-3xl font-bold text-accent-400">95%</p>
                                        <p className="text-xs font-medium uppercase tracking-wider mt-1 opacity-80">Success Rate</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-success-400">100k</p>
                                        <p className="text-xs font-medium uppercase tracking-wider mt-1 opacity-80">Users</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
