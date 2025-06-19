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
  isFavorite?: boolean;
  relevanceScore: number;
  url: string;
  relativeTime?: string;
  sourceType: string;
  rawRssContent?: string;
}

export interface Location {
  city: string;
  region: string;
  country: string;
  nearbyCities: string[];
  lat: number;
  lon: number;
}

export type NewsFilter = 'alles' | 'lokaal' | 'regionaal' | 'belangrijk' | 'evenementen';
export type Language = 'nl' | 'en' | 'fr' | 'de';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  province: string;
  image: string;
}
