import { UploadCloud, Sparkles, Users, ClipboardCheck, Clock, Files, BrainCircuit, LucideIcon } from 'lucide-react';

// How It Works Steps
export interface Step {
    icon: LucideIcon;
    title: string;
    desc: string;
}

export const HOW_IT_WORKS_STEPS: Step[] = [
    {
        icon: UploadCloud,
        title: '1. Ingest',
        desc: 'Upload scans, reports, and history. CYNO standardizes diverse formats.'
    },
    {
        icon: Sparkles,
        title: '2. Synthesize',
        desc: 'AI extracts key biomarkers and creates a structured chronological timeline.'
    },
    {
        icon: Users,
        title: '3. Collaborate',
        desc: 'Tumor boards review the auto-generated case summary in real-time.'
    },
    {
        icon: ClipboardCheck,
        title: '4. Decide',
        desc: 'Clinicians make the final call. Treatment pathways are documented instantly.'
    }
];

// Challenge Cards
export interface Challenge {
    icon: LucideIcon;
    title: string;
    description: string;
    iconColor: string;
}

export const CHALLENGES: Challenge[] = [
    {
        icon: Clock,
        title: 'Critical Delays',
        description: 'Manual data gathering for tumor boards delays treatment decisions by an average of 7-14 days.',
        iconColor: 'text-red-500'
    },
    {
        icon: Files,
        title: 'Data Overload',
        description: 'Oncologists spend 30% of their time just hunting for reports across disconnected EMR systems.',
        iconColor: 'text-orange-500'
    },
    {
        icon: BrainCircuit,
        title: 'Cognitive Load',
        description: 'Synthesizing radiology, pathology, and genomics manually increases the risk of missed insights.',
        iconColor: 'text-purple-500'
    }
];

// Blog Posts
export interface BlogPost {
    category: string;
    color: string;
    title: string;
    desc: string;
}

export const BLOG_POSTS: BlogPost[] = [
    {
        category: 'CLINICAL WORKFLOW',
        color: 'sky',
        title: 'Reducing Tumor Board Prep Time by 50%',
        desc: 'How AI summarization is giving hours back to oncologists.'
    },
    {
        category: 'TECHNOLOGY',
        color: 'teal',
        title: 'RAG in Healthcare: A Deep Dive',
        desc: 'Understanding Retrieval Augmented Generation for patient history.'
    },
    {
        category: 'ETHICS',
        color: 'slate',
        title: 'The Trust Gap in Medical AI',
        desc: 'Why transparency is the only way forward for MedTech.'
    }
];

// Navigation Links
export interface NavLink {
    href: string;
    label: string;
}

export const NAV_LINKS: NavLink[] = [
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#platform', label: 'Platform' },
    { href: '#ethics', label: 'Ethics & Privacy' },
    { href: '#blog', label: 'Insights' }
];

// Footer Links
export const FOOTER_LINKS: NavLink[] = [
    { href: '#', label: 'Privacy Policy' },
    { href: '#', label: 'Terms of Service' },
    { href: '#', label: 'Contact Support' }
];
