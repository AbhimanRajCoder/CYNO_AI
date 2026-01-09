"use client";

import React from 'react';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';

const BENEFITS = [
    "Free 30-day pilot program",
    "Dedicated onboarding support",
    "HIPAA compliant architecture"
];

export default function CTASection() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-600 via-sky-700 to-teal-700 animate-gradient" />

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-10 left-[10%] w-32 h-32 bg-white/5 rounded-full blur-xl animate-float" />
                <div className="absolute top-1/2 right-[15%] w-48 h-48 bg-white/5 rounded-full blur-xl animate-float" style={{ animationDelay: "2s" }} />
                <div className="absolute bottom-20 left-[30%] w-24 h-24 bg-white/5 rounded-full blur-xl animate-float" style={{ animationDelay: "1s" }} />
            </div>

            {/* Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            ></div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-8 animate-fade-in">
                    <Sparkles className="w-4 h-4" />
                    Limited Pilot Spots Available
                </div>

                {/* Headline */}
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in">
                    Bring clarity to your hospital.
                </h2>

                {/* Description */}
                <p className="text-lg md:text-xl text-sky-100 mb-8 max-w-2xl mx-auto animate-fade-in">
                    Join the pilot program for CYNO and transform how your oncology department coordinates care.
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap justify-center gap-4 mb-10 animate-fade-in">
                    {BENEFITS.map((benefit, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 text-white/90 text-sm"
                        >
                            <CheckCircle className="w-4 h-4 text-teal-300" />
                            {benefit}
                        </div>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
                    <button className="group relative overflow-hidden bg-white text-sky-700 px-10 py-4 rounded-full font-bold shadow-2xl hover:shadow-sky-500/25 transition-all flex items-center justify-center gap-2">
                        <span className="relative z-10">Request Pilot Access</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button className="bg-transparent text-white border-2 border-white/30 px-10 py-4 rounded-full font-semibold hover:bg-white/10 hover:border-white/50 transition-all">
                        Schedule a Demo
                    </button>
                </div>

                {/* Trust Note */}
                <p className="mt-8 text-sm text-sky-200/70 animate-fade-in">
                    No credit card required • Setup in under 24 hours
                </p>
            </div>
        </section>
    );
}

