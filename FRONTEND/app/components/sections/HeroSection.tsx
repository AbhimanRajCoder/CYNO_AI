"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, PlayCircle, CheckCircle, Sparkles, Activity, Shield } from 'lucide-react';
import TimelineCard from '@/app/components/ui/TimelineCard';

const TYPING_TEXTS = [
    "outcomes suffer.",
    "lives are at stake.",
    "every second counts."
];

function TypingAnimation() {
    const [textIndex, setTextIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentFullText = TYPING_TEXTS[textIndex];
        const typingSpeed = isDeleting ? 50 : 100;

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (displayText.length < currentFullText.length) {
                    setDisplayText(currentFullText.slice(0, displayText.length + 1));
                } else {
                    setTimeout(() => setIsDeleting(true), 2000);
                }
            } else {
                if (displayText.length > 0) {
                    setDisplayText(displayText.slice(0, -1));
                } else {
                    setIsDeleting(false);
                    setTextIndex((prev) => (prev + 1) % TYPING_TEXTS.length);
                }
            }
        }, typingSpeed);

        return () => clearTimeout(timeout);
    }, [displayText, isDeleting, textIndex]);

    return (
        <span className="hero-gradient-text">
            {displayText}
            <span className="animate-blink text-sky-600">|</span>
        </span>
    );
}

export default function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden hero-bg">
            {/* Background Blurs - Enhanced */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-pulse-slow"></div>
                <div className="absolute top-[20%] right-[20%] w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-pulse-slow-delayed"></div>
                <div className="absolute bottom-[10%] left-[40%] w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-[60px] opacity-40 animate-float"></div>
            </div>

            {/* Floating Icons - Decorative */}
            <div className="absolute top-32 left-[10%] text-sky-200 animate-float hidden lg:block">
                <Activity className="w-8 h-8" />
            </div>
            <div className="absolute top-48 right-[8%] text-teal-200 animate-float hidden lg:block" style={{ animationDelay: "1s" }}>
                <Shield className="w-10 h-10" />
            </div>
            <div className="absolute bottom-32 left-[15%] text-sky-200 animate-float hidden lg:block" style={{ animationDelay: "2s" }}>
                <Sparkles className="w-6 h-6" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Hero Content */}
                    <div className="hero-content">
                        {/* Badge - Enhanced */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-100 text-sky-800 text-xs font-semibold mb-6 animate-slide-up">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                            </span>
                            New: Intelligent Tumor Board Support
                            <Sparkles className="w-3 h-3 text-amber-500" />
                        </div>

                        {/* Headline - With Typing Animation */}
                        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight animate-fade-in">
                            When cancer care is delayed, <br />
                            <TypingAnimation />
                        </h1>

                        {/* Description */}
                        <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-lg animate-slide-up" style={{ animationDelay: "200ms" }}>
                            CYNO helps multidisciplinary teams organize fragmented patient data, reduce coordination delays, and make confident decisions — faster.
                        </p>

                        {/* CTA Buttons - Enhanced */}
                        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "400ms" }}>
                            <a href='hospital/signin' >
                                <button className=" cursor-pointer relative overflow-hidden bg-gradient-to-r from-sky-600 to-sky-700 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 group">
                                    <span className="relative z-10">Sign In</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-sky-700 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </a>
                            <a href='https://www.youtube.com/watch?v=usVIUWLIdF8' target="_blank" >
                                <button className="cursor-pointer bg-white/80 backdrop-blur-sm text-slate-700 border border-slate-200 px-8 py-4 rounded-full font-medium hover:bg-white hover:border-sky-200 hover:text-sky-700 transition-all flex items-center justify-center gap-2 group">
                                    <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    See How It Works
                                </button>
                            </a>
                        </div>

                        {/* Trust Indicators - Enhanced */}
                        <div className="mt-10 flex flex-wrap items-center gap-6 animate-slide-up" style={{ animationDelay: "600ms" }}>
                            <div className="flex -space-x-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 border-2 border-white flex items-center justify-center text-lg shadow-sm">🩺</div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 border-2 border-white flex items-center justify-center text-lg shadow-sm">🩻</div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-white flex items-center justify-center text-lg shadow-sm">🔬</div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-white flex items-center justify-center text-sm font-bold text-slate-600 shadow-sm">+50</div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Trusted by forward-thinking oncologists</p>
                                <p className="text-xs text-slate-400">at leading cancer centers worldwide</p>
                            </div>
                        </div>
                    </div>

                    {/* Hero Visual */}
                    <div className="relative hero-visual hidden lg:block animate-slide-right">
                        <TimelineCard />

                        {/* Floating Badge */}
                        <div className="absolute top-1/2 -right-8 bg-white p-4 rounded-xl shadow-lg border border-slate-50 animate-float z-20">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400">Data Streams</div>
                                    <div className="text-sm font-bold text-slate-800">Synchronized</div>
                                </div>
                            </div>
                        </div>

                        {/* New: AI Processing Badge */}
                        <div className="absolute bottom-16 -left-4 bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg animate-float z-20" style={{ animationDelay: "2s" }}>
                            <div className="flex items-center gap-2 text-white">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-xs font-medium">AI Processing</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 animate-bounce-slow">
                <span className="text-xs font-medium">Scroll to explore</span>
                <div className="w-5 h-8 rounded-full border-2 border-slate-300 flex justify-center pt-1">
                    <div className="w-1 h-2 bg-slate-400 rounded-full animate-bounce" />
                </div>
            </div>
        </section>
    );
}

