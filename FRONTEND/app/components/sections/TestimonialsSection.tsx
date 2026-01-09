"use client";

import React, { useState, useEffect } from 'react';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Testimonial {
    quote: string;
    author: string;
    role: string;
    institution: string;
    avatar: string;
    rating: number;
}

const TESTIMONIALS: Testimonial[] = [
    {
        quote: "CYNO has revolutionized how we prepare for tumor board meetings. What used to take hours now takes minutes, giving us more time to focus on patient care.",
        author: "Dr. Sarah Chen",
        role: "Chief of Oncology",
        institution: "Memorial Cancer Center",
        avatar: "👩‍⚕️",
        rating: 5
    },
    {
        quote: "The AI-powered synthesis of patient data is incredibly accurate. It's like having an extra team member who never misses a detail from the patient's history.",
        author: "Dr. Michael Roberts",
        role: "Medical Oncologist",
        institution: "University Health Network",
        avatar: "👨‍⚕️",
        rating: 5
    },
    {
        quote: "Finally, a tool that understands the complexity of multidisciplinary cancer care. The chronological timeline feature alone has saved countless hours.",
        author: "Dr. Emily Watson",
        role: "Radiation Oncologist",
        institution: "Pacific Medical Center",
        avatar: "👩‍🔬",
        rating: 5
    }
];

export default function TestimonialsSection() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const handlePrev = () => {
        setIsAutoPlaying(false);
        setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    };

    const handleNext = () => {
        setIsAutoPlaying(false);
        setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    };

    return (
        <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 w-40 h-40 bg-sky-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-50" />

            <div className="max-w-5xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16 animate-on-scroll">
                    <span className="inline-block px-4 py-1.5 bg-sky-50 text-sky-600 text-xs font-semibold tracking-widest uppercase rounded-full mb-4 border border-sky-100">
                        Testimonials
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Trusted by Leading Oncologists
                    </h2>
                    <p className="text-slate-500 max-w-xl mx-auto">
                        Hear from healthcare professionals who are transforming their practice with CYNO.
                    </p>
                </div>

                {/* Testimonial Card */}
                <div className="relative">
                    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100 relative overflow-hidden animate-on-scroll">
                        {/* Quote Icon */}
                        <div className="absolute top-6 right-8 text-sky-100">
                            <Quote className="w-24 h-24" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Stars */}
                            <div className="flex gap-1 mb-6">
                                {[...Array(TESTIMONIALS[activeIndex].rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                                ))}
                            </div>

                            {/* Quote */}
                            <blockquote className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed mb-8 transition-all duration-500">
                                &ldquo;{TESTIMONIALS[activeIndex].quote}&rdquo;
                            </blockquote>

                            {/* Author */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-sky-100 to-teal-100 rounded-full flex items-center justify-center text-2xl">
                                    {TESTIMONIALS[activeIndex].avatar}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">{TESTIMONIALS[activeIndex].author}</div>
                                    <div className="text-sm text-slate-500">
                                        {TESTIMONIALS[activeIndex].role} • {TESTIMONIALS[activeIndex].institution}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gradient Accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-teal-500 to-sky-500" />
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-center gap-4 mt-8">
                        <button
                            onClick={handlePrev}
                            className="p-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-600 transition-all shadow-sm"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Dots */}
                        <div className="flex items-center gap-2">
                            {TESTIMONIALS.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setIsAutoPlaying(false);
                                        setActiveIndex(index);
                                    }}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${index === activeIndex
                                            ? 'bg-sky-500 w-8'
                                            : 'bg-slate-300 hover:bg-slate-400'
                                        }`}
                                    aria-label={`Go to testimonial ${index + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            className="p-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-600 transition-all shadow-sm"
                            aria-label="Next testimonial"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
