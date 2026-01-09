import React from 'react';
import { Activity } from 'lucide-react';
import { FOOTER_LINKS } from '@/app/lib/constants';

export default function Footer() {
    return (
        <footer className="bg-white py-12 border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-900 rounded text-white flex items-center justify-center">
                        <Activity className="w-3 h-3" />
                    </div>
                    <span className="font-bold text-slate-900 tracking-tight">CYNO</span>
                </div>

                {/* Footer Links */}
                <div className="flex gap-8 text-sm text-slate-500">
                    {FOOTER_LINKS.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="hover:text-slate-900 transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Copyright */}
                <div className="text-xs text-slate-400">
                    &copy; 2025 Cyno Health Inc. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
