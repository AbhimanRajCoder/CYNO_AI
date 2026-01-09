"use client";

import React from 'react';
import { Activity } from 'lucide-react';
import { NAV_LINKS } from '@/app/lib/constants';
import { useNavShadow } from '@/app/hooks/useScrollAnimation';

export default function Navbar() {
    const navShadow = useNavShadow();

    return (
        <nav className={`fixed w-full z-50 glass-nav transition-all duration-300 ${navShadow ? 'shadow-sm' : ''}`}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2 cursor-pointer">
                    <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white">
                        <Activity className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">CYNO</span>
                </div>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="hover:text-sky-600 transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* CTA Button */}
                <a href="/hospital/signin">
                    <button className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer">
                        Sign In
                    </button>
                </a>
            </div>
        </nav>
    );
}
