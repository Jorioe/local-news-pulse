
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
}

export interface Location {
  city: string;
  region: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type NewsFilter = 'alles' | 'lokaal' | 'regionaal' | 'belangrijk';
export type Language = 'nl' | 'en' | 'fr';
