import { Trophy, TrendingUp, Award, Star } from "lucide-react";

export default function ResultsSection() {
    const stats = [
        { label: "Selections in Top IITs", value: "2,500+", icon: <Trophy className="w-6 h-6 text-primary-500" /> },
        { label: "NEET Selections", value: "3,100+", icon: <TrendingUp className="w-6 h-6 text-success-500" /> },
        { label: "NDA Qualifiers", value: "850+", icon: <Award className="w-6 h-6 text-accent-500" /> },
        { label: "Tech Placements", value: "500+", icon: <Star className="w-6 h-6 text-warning-500" /> }
    ];

    const topRankers = [
        { rank: "AIR 1", exam: "JEE Adv. 2025", name: "Rishabh K.", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&h=200&q=80" },
        { rank: "AIR 3", exam: "NEET 2025", name: "Aarohi P.", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&h=200&q=80" },
        { rank: "AIR 5", exam: "JEE Main 2025", name: "Aryan S.", img: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80" },
        { rank: "AIR 8", exam: "NEET 2025", name: "Meera R.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80" },
    ];

    return (
        <section id="results" className="py-24 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
                        Proven Results & <span className="text-success-600">Achievements</span>
                    </h2>
                    <p className="text-lg text-surface-600 dark:text-surface-400">
                        Our students consistently secure top ranks in the toughest competitive exams in India.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl p-8 text-center shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-surface-900 shadow-sm flex items-center justify-center mx-auto mb-4 border border-surface-100 dark:border-surface-800">
                                {stat.icon}
                            </div>
                            <h4 className="text-4xl font-bold text-surface-900 dark:text-white mb-2">{stat.value}</h4>
                            <p className="text-surface-600 dark:text-surface-400 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Rankers Grid */}
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white">Our Recent Top Rankers</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {topRankers.map((ranker, idx) => (
                        <div key={idx} className="bg-surface-50 dark:bg-surface-950 rounded-3xl p-6 text-center border border-surface-100 dark:border-surface-800 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3">
                                <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 rounded-full flex items-center justify-center">
                                    <Star className="w-5 h-5 fill-current" />
                                </div>
                            </div>
                            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border-4 border-white dark:border-surface-800 shadow-lg">
                                <img src={ranker.img} alt={ranker.name} className="w-full h-full object-cover" />
                            </div>
                            <h4 className="font-bold text-lg text-surface-900 dark:text-white">{ranker.name}</h4>
                            <p className="text-primary-600 font-bold font-display text-xl my-1">{ranker.rank}</p>
                            <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold">{ranker.exam}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
