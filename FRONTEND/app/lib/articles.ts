import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

// Articles directory path
const articlesDirectory = path.join(process.cwd(), 'articles');

// Types
export interface ArticleMeta {
    title: string;
    slug: string;
    description: string;
    author: string;
    image?: string;
    date: string;
    tags: string[];
}

export interface Article extends ArticleMeta {
    content: string;
}

export interface ArticlePreview extends ArticleMeta {
    excerpt?: string;
}

/**
 * Get all article slugs for static generation
 */
export function getArticleSlugs(): string[] {
    const fileNames = fs.readdirSync(articlesDirectory);
    return fileNames
        .filter((fileName) => fileName.endsWith('.md'))
        .map((fileName) => fileName.replace(/\.md$/, ''));
}

/**
 * Get all articles metadata (for listing page)
 */
export function getAllArticles(): ArticlePreview[] {
    const slugs = getArticleSlugs();

    const articles = slugs.map((slug) => {
        const fullPath = path.join(articlesDirectory, `${slug}.md`);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        // Create a short excerpt from content (first 150 chars)
        const plainContent = content.replace(/[#*`>\[\]]/g, '').trim();
        const excerpt = plainContent.substring(0, 150) + '...';

        return {
            slug,
            title: data.title || 'Untitled',
            description: data.description || '',
            author: data.author || 'Anonymous',
            image: data.image || undefined,
            date: data.date || new Date().toISOString().split('T')[0],
            tags: data.tags || [],
            excerpt,
        };
    });

    // Sort by date (newest first)
    return articles.sort((a, b) => (a.date > b.date ? -1 : 1));
}

/**
 * Get a single article by slug with parsed HTML content
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
    try {
        const fullPath = path.join(articlesDirectory, `${slug}.md`);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        // Convert markdown to HTML
        const processedContent = await remark()
            .use(html, { sanitize: false })
            .process(content);
        const contentHtml = processedContent.toString();

        return {
            slug,
            title: data.title || 'Untitled',
            description: data.description || '',
            author: data.author || 'Anonymous',
            image: data.image || undefined,
            date: data.date || new Date().toISOString().split('T')[0],
            tags: data.tags || [],
            content: contentHtml,
        };
    } catch {
        return null;
    }
}

/**
 * Get latest N articles for homepage
 */
export function getLatestArticles(count: number = 3): ArticlePreview[] {
    const allArticles = getAllArticles();
    return allArticles.slice(0, count);
}
