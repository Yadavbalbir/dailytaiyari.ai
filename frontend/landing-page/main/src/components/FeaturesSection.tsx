import { LayoutDashboard, Video, Trophy, Users } from "lucide-react";

export default function FeaturesSection() {
    const features = [
        {
            title: "Interactive Live Classes",
            description: "Engage with faculty in real-time. Raise your hand, participate in polls, and never miss a beat with HD recordings available instantly.",
            icon: <Video className="w-6 h-6 text-white" />,
            gradient: "from-primary-500 to-primary-600"
        },
        {
            title: "All-India Test Series",
            description: "Simulate exact exam conditions. Benchmark yourself against thousands of aspirants nationwide with detailed difficulty-wise analyses.",
            icon: <Trophy className="w-6 h-6 text-white" />,
            gradient: "from-accent-500 to-accent-600"
        },
        {
            title: "Smart Dashboard & XP",
            description: "Gamified learning experience. Earn XP, maintain streaks, and stay motivated every single day.",
            icon: <LayoutDashboard className="w-6 h-6 text-white" />,
            gradient: "from-success-500 to-success-600"
        },
        {
            title: "Elite Mentorship",
            description: "Your personal guide. Get strategy sessions, timetable planning, and emotional support from top college alumni.",
            icon: <Users className="w-6 h-6 text-white" />,
            gradient: "from-warning-500 to-warning-600"
        }
    ];

    return (
        <section id="features" className="py-24 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
                        Unmatched <span className="text-accent-600">Features</span> for Peak Performance
                    </h2>
                    <p className="text-lg text-surface-600 dark:text-surface-400">
                        A technology platform built specifically for competitive exam aspirants.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex flex-col p-8 rounded-3xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 relative overflow-hidden group hover:border-surface-300 dark:hover:border-surface-700 transition-colors">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg shadow-${feature.gradient.split('-')[1]}/30 group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="font-bold text-surface-900 dark:text-white text-xl mb-3">{feature.title}</h3>
                            <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
