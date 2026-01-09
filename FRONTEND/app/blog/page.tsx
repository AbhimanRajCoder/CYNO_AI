import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import { getAllArticles } from '@/app/lib/articles';

export const metadata = {
    title: 'Blog | CYNO - AI-Powered Cancer Care',
    description: 'Insights on AI-powered cancer diagnostics, clinical workflows, and healthcare innovation.',
};

export default function BlogPage() {
    const articles = getAllArticles();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Latest Insights</h1>
                    <p className="text-lg text-slate-500">
                        Explore our latest articles on AI-powered cancer diagnostics and healthcare innovation.
                    </p>
                </div>
            </header>

            {/* Articles Grid */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {articles.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-slate-500">No articles found.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article) => (
                            <Link
                                key={article.slug}
                                href={`/blog/${article.slug}`}
                                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-sky-100 transition-all duration-300"
                            >
                                {/* Card Header with Feature Image */}
                                <div className="h-48 bg-gradient-to-br from-sky-100 to-teal-50 relative overflow-hidden">
                                    {article.image ? (
                                        <Image
                                            src={article.image}
                                            alt={article.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="text-6xl opacity-30">📄</div>
                                        </div>
                                    )}
                                </div>

                                {/* Card Content */}
                                <div className="p-6">
                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {article.tags.slice(0, 2).map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 bg-sky-50 text-sky-700 text-xs font-medium rounded"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-sky-600 transition-colors line-clamp-2">
                                        {article.title}
                                    </h2>

                                    {/* Description */}
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-3">
                                        {article.description}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(article.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {article.author}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
