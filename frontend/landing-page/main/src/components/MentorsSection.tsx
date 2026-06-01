import Image from 'next/image';
import { Star } from 'lucide-react';

export default function MentorsSection() {
    const mentors = [
        {
            name: "Dr. Arvind Kumar",
            subject: "Physics (JEE Adv.)",
            credential: "B.Tech, IIT Delhi",
            experience: "15+ Years",
            students: "10k+",
            image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&h=400&q=80"
        },
        {
            name: "Sneha Sharma",
            subject: "Biology (NEET)",
            credential: "MBBS, AIIMS Delhi",
            experience: "12+ Years",
            students: "15k+",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80"
        },
        {
            name: "Rahul Verma",
            subject: "Mathematics",
            credential: "M.Sc, IIT Kanpur",
            experience: "10+ Years",
            students: "8k+",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80"
        },
        {
            name: "Ananya G",
            subject: "MERN / Web Dev",
            credential: "SDE II, Ex-Google",
            experience: "8+ Years",
            students: "5k+",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80"
        }
    ];

    return (
        <section id="mentors" className="py-24 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30 dark:opacity-10">
                <div className="absolute top-10 left-10 w-64 h-64 bg-accent-300 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300 rounded-full blur-[100px]"></div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
                        Learn from India's <span className="text-accent-600">Top Educators</span>
                    </h2>
                    <p className="text-lg text-surface-600 dark:text-surface-400">
                        Our faculty consists of alumni from premier institutes who have produced top ranks consistently.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {mentors.map((mentor, idx) => (
                        <div key={idx} className="bg-white dark:bg-surface-900 rounded-3xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-md group hover:-translate-y-2 transition-all hover:shadow-xl hover:shadow-accent-500/10">
                            <div className="aspect-[4/5] relative overflow-hidden">
                                <img src={mentor.image} alt={mentor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-surface-900/90 to-transparent p-6 pt-12">
                                    <h3 className="text-white font-bold text-xl">{mentor.name}</h3>
                                    <p className="text-accent-300 font-medium text-sm">{mentor.subject}</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold px-2 py-1 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 rounded-lg">{mentor.credential}</span>
                                    <div className="flex items-center text-warning-500 text-sm font-bold">
                                        <Star className="w-4 h-4 fill-current mr-1" /> 4.9
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm text-surface-600 dark:text-surface-400 border-t border-surface-100 dark:border-surface-800 pt-4">
                                    <div className="text-center">
                                        <p className="font-bold text-surface-900 dark:text-white">{mentor.experience}</p>
                                        <p className="text-xs">Experience</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-surface-900 dark:text-white">{mentor.students}</p>
                                        <p className="text-xs">Students</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
