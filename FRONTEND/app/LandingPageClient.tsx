"use client";

import React from 'react';
import { useScrollAnimation } from '@/app/hooks/useScrollAnimation';
import {
    Navbar,
    Footer,
    HeroSection,
    ChallengeSection,
    HowItWorksSection,
    PlatformSection,
    EthicsSection,
    CTASection
} from '@/app/components';
import BlogSection from '@/app/components/sections/BlogSection';
import StatsSection from '@/app/components/sections/StatsSection';
import TestimonialsSection from '@/app/components/sections/TestimonialsSection';
import { ArticlePreview } from '@/app/lib/articles';

interface LandingPageClientProps {
    articles: ArticlePreview[];
}

export default function LandingPageClient({ articles }: LandingPageClientProps) {
    // Initialize scroll animations
    useScrollAnimation();

    return (
        <div className="overflow-x-hidden bg-gray-50 text-slate-700 font-sans">
            {/* Navigation */}
            <Navbar />

            {/* Hero Section */}
            <HeroSection />

            {/* Challenge Section */}
            <ChallengeSection />

            {/* Stats Section - Impact Metrics */}
            <StatsSection />

            <BlogSection articles={articles} />

            {/* How It Works Section */}
            <HowItWorksSection />

            {/* Platform Section */}
            <PlatformSection />

            {/* Ethics Section */}
            <EthicsSection />

            {/* Testimonials Section */}
            {/* <TestimonialsSection /> */}

            {/* Blog Section */}

            {/* CTA Section */}
            {/* <CTASection /> */}

            {/* Footer */}
            <Footer />
        </div>
    );
}
