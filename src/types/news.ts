export type ContentCategory = 'politiek' | 'cultuur' | 'veiligheid' | 'economie' | 'sport' | 'onderwijs' | 'gezondheid';

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
  contentCategory?: ContentCategory;
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
  isFavorite?: boolean;
  coordinates?: {
    lat: number;
    lon: number;
  };
  lineup?: {
    name: string;
    time?: string;
    description?: string;
  }[];
  ticketInfo?: {
    price: string;
    url: string;
    availability: 'available' | 'limited' | 'sold_out';
  };
  organizer?: {
    name: string;
    website?: string;
    phone?: string;
    email?: string;
  };
  fullDescription?: string;
  category?: string;
  tags?: string[];
}
