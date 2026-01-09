"use client";

import React, { useEffect, useState, useRef } from 'react';

interface StatItemProps {
    value: number;
    suffix: string;
    label: string;
    delay: number;
}

function AnimatedCounter({ value, suffix, label, delay }: StatItemProps) {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const timeout = setTimeout(() => {
            const duration = 2000;
            const steps = 60;
            const increment = value / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= value) {
                    setCount(value);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(current));
                }
            }, duration / steps);

            return () => clearInterval(timer);
        }, delay);

        return () => clearTimeout(timeout);
    }, [isVisible, value, delay]);

    return (
        <div
            ref={ref}
            className="text-center p-6 group"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="relative inline-block">
                <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-sky-400 to-teal-400 bg-clip-text text-transparent">
                    {count}
                </span>
                <span className="text-3xl md:text-4xl font-bold text-sky-400">{suffix}</span>
            </div>
            <p className="mt-3 text-slate-400 text-sm md:text-base font-medium">{label}</p>
            <div className="mt-4 w-16 h-1 mx-auto bg-gradient-to-r from-sky-500 to-teal-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>
    );
}

const STATS = [
    { value: 50, suffix: '%', label: 'Reduction in Prep Time', delay: 0 },
    { value: 7, suffix: '+', label: 'Days Saved Per Case', delay: 200 },
    { value: 95, suffix: '%', label: 'Data Accuracy', delay: 400 },
    { value: 24, suffix: '/7', label: 'AI-Powered Support', delay: 600 },
];

export default function StatsSection() {
    return (
        <section className="py-20 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

            {/* Animated Background Orbs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow-delayed" />

            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16 animate-on-scroll">
                    <span className="inline-block px-4 py-1.5 bg-sky-500/10 text-sky-400 text-xs font-semibold tracking-widest uppercase rounded-full mb-4">
                        Impact Metrics
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Transforming Cancer Care with Numbers
                    </h2>
                    <p className="text-slate-400 max-w-xl mx-auto">
                        Real results from oncology teams using CYNO to streamline their workflows.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {STATS.map((stat, index) => (
                        <AnimatedCounter
                            key={index}
                            value={stat.value}
                            suffix={stat.suffix}
                            label={stat.label}
                            delay={stat.delay}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
