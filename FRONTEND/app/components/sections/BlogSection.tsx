import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { ArticlePreview } from '@/app/lib/articles';

interface BlogSectionProps {
    articles: ArticlePreview[];
}

export default function BlogSection({ articles }: BlogSectionProps) {
    // If no articles exist, show placeholder
    if (!articles || articles.length === 0) {
        return (
            <section id="blog" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-end mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Latest Insights</h2>
                        <Link href="/blog" className="text-sky-600 text-sm font-medium hover:underline">
                            View all posts
                        </Link>
                    </div>
                    <div className="text-center py-12 text-slate-500">
                        No articles available yet.
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="blog" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="flex justify-between items-end mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">Latest Insights</h2>
                    <Link href="/blog" className="text-sky-600 text-sm font-medium hover:underline">
                        View all posts
                    </Link>
                </div>

                {/* Articles Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {articles.map((article) => (
                        <Link
                            key={article.slug}
                            href={`/blog/${article.slug}`}
                            className="group cursor-pointer animate-on-scroll"
                        >
                            {/* Card Image */}
                            <div className="h-48 bg-gradient-to-br from-sky-100 to-teal-50 rounded-xl mb-4 overflow-hidden relative">
                                {article.image ? (
                                    <Image
                                        src={article.image}
                                        alt={article.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-5xl opacity-30">📄</div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-sky-900/5 group-hover:bg-transparent transition-colors"></div>
                            </div>

                            {/* Category/Tags */}
                            <div className="flex gap-2 mb-2">
                                {article.tags.slice(0, 1).map((tag) => (
                                    <span key={tag} className="text-xs font-bold text-sky-600">
                                        {tag.toUpperCase()}
                                    </span>
                                ))}
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-sky-600 transition-colors line-clamp-2">
                                {article.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-slate-500 line-clamp-2">
                                {article.description}
                            </p>

                            {/* Meta */}
                            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(article.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
