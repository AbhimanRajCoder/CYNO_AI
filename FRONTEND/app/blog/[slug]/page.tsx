import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import { getArticleBySlug, getArticleSlugs } from '@/app/lib/articles';

// Generate static params for all articles
export async function generateStaticParams() {
    const slugs = getArticleSlugs();
    return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
        return { title: 'Article Not Found' };
    }

    return {
        title: `${article.title} | CYNO Blog`,
        description: article.description,
    };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Blog
                    </Link>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-sky-50 text-sky-700 text-xs font-medium rounded-full"
                            >
                                <Tag className="w-3 h-3" />
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                        {article.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {article.author}
                        </span>
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(article.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            </header>

            {/* Feature Image */}
            {article.image && (
                <div className="max-w-4xl mx-auto px-6 pt-8">
                    <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden">
                        <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>
            )}

            {/* Article Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <article
                    className="prose prose-slate prose-lg max-w-none"
                    dangerouslySetInnerHTML={{
                        __html: article.content
                            // Remove the first H1 tag to avoid duplicate heading
                            .replace(/<h1[^>]*>.*?<\/h1>/i, '')
                            // Also remove any leading H2 subtitle if it immediately follows
                            .replace(/^(\s*<h2[^>]*>.*?<\/h2>\s*<hr>?)/i, '')
                            .trim()
                    }}
                />

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-slate-200">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        View all articles
                    </Link>
                </div>
            </main>
        </div>
    );
}
