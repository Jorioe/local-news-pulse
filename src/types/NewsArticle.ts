export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  thumbnail: string;
  location: string;
  publishedAt: string;
  source: string;
  author: string;
  category: 'lokaal' | 'regionaal' | 'belangrijk';
  relevanceScore: number;
} 