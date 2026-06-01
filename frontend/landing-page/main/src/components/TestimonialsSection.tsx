import { Quote } from "lucide-react";

export default function TestimonialsSection() {
    const testimonials = [
        {
            text: "DailyTaiyari's live classes and the 1:1 mentorship program completely changed my strategy. The faculty's focus on conceptual clarity helped me secure AIR 105 in JEE Advanced.",
            author: "Aditya V.",
            role: "IIT Bombay, CS",
            image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&h=150&q=80"
        },
        {
            text: "The test series is flawlessly aligned with the actual NEET exam pattern. The post-test analytics pinpointed exactly where I was losing marks.",
            author: "Srishti K.",
            role: "AIIMS Delhi",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
        },
        {
            text: "Coming from a tier-3 city, finding good offline coaching was hard. DailyTaiyari gave me access to top educators right from my home. Forever grateful!",
            author: "Nitin P.",
            role: "NDA Cadet",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
        }
    ];

    return (
        <section id="testimonials" className="py-24 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
                        Hear it from our <span className="text-primary-600">Champions</span>
                    </h2>
                    <p className="text-lg text-surface-600 dark:text-surface-400">
                        Listen to the success stories of students who transformed their preparation journey with us.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, idx) => (
                        <div key={idx} className="bg-white dark:bg-surface-900 rounded-3xl p-8 border border-surface-100 dark:border-surface-800 shadow-sm relative">
                            <Quote className="absolute top-6 right-6 w-10 h-10 text-primary-100 dark:text-surface-800" />
                            <p className="text-surface-700 dark:text-surface-300 relative z-10 mb-8 italic">"{t.text}"</p>
                            <div className="flex items-center gap-4 border-t border-surface-100 dark:border-surface-800 pt-6">
                                <img src={t.image} alt={t.author} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <h5 className="font-bold text-surface-900 dark:text-white">{t.author}</h5>
                                    <p className="text-sm text-primary-600 font-medium">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
