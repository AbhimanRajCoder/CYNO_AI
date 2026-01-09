import React from 'react';
import LandingPageClient from './LandingPageClient';
import { getLatestArticles } from '@/app/lib/articles';

export default function CynoLanding() {
  // Fetch articles on the server
  const articles = getLatestArticles(3);

  return <LandingPageClient articles={articles} />;
}