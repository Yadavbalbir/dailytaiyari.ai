"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQSection() {
    const faqs = [
        {
            q: "What makes DailyTaiyari different from other coaching platforms?",
            a: "We offer a unique hybrid model, incorporating AI-driven performance analytics, 1:1 dedicated mentorship, and an engaging gamified platform that makes learning addictive. Most platforms just give you videos; we give you an entire ecosystem."
        },
        {
            q: "Are the Live Classes recorded in case I miss one?",
            a: "Yes! Every single live class is recorded in HD and made available on your dashboard within 2 hours. You can watch it unlimited times until your subscription expires."
        },
        {
            q: "How does the 1:1 mentorship program work?",
            a: "Once you purchase a premium plan, you are assigned a dedicated mentor (an alum of IIT/AIIMS). You can book regular 1-on-1 strategy and doubt-clearing sessions through our integrated calendar."
        },
        {
            q: "Can I upgrade my plan later?",
            a: "Absolutely. You can start with a basic plan and upgrade to a premium/mentorship plan anytime by just paying the difference amount."
        },
        {
            q: "Do you offer offline mock tests?",
            a: "Yes. For our hybrid users, mock tests are conducted in-person at our local study centers to simulate exact exam conditions. Online users take CBTs (Computer Based Tests) mirroring the actual NTA interface."
        },
        {
            q: "Do you provide placement guarantee for coding courses?",
            a: "Yes! Our Full-Stack cohort programs come with dedicated placement assistance, mock interviews with FAANG engineers, and a conditional placement guarantee."
        }
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <section id="faq" className="py-24 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-display font-bold text-surface-900 dark:text-white mb-4">
                        Frequently Asked <span className="text-primary-600">Questions</span>
                    </h2>
                    <p className="text-lg text-surface-600 dark:text-surface-400">
                        Got questions? We've got answers.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden bg-surface-50 dark:bg-surface-950">
                            <button
                                onClick={() => toggle(idx)}
                                className="w-full text-left px-6 py-5 flex justify-between items-center bg-white dark:bg-surface-900 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                                <span className="font-bold text-surface-900 dark:text-white pr-4">{faq.q}</span>
                                {openIndex === idx ? (
                                    <ChevronUp className="w-5 h-5 text-primary-500 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-surface-400 flex-shrink-0" />
                                )}
                            </button>
                            <AnimatePresence>
                                {openIndex === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 py-5 text-surface-600 dark:text-surface-400 border-t border-surface-100 dark:border-surface-800">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
