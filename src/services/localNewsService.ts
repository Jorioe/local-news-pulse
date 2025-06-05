import { Location } from '../types/Location';
import { NewsArticle } from '../types/NewsArticle';
import { createUniqueId } from '../utils/idGenerator';

interface NewsSource {
  name: string;
  searchUrl: string;
  articleSelector: string;
  titleSelector: string;
  summarySelector: string;
  linkSelector: string;
  imageSelector: string;
  dateSelector: string;
  baseUrl: string;
}

const NEWS_SOURCES: NewsSource[] = [
  {
    name: 'BN DeStem',
    searchUrl: '/api/news/zoeken/?query=',
    articleSelector: 'article.article-preview',
    titleSelector: 'h3.article-preview__title',
    summarySelector: 'p.article-preview__intro',
    linkSelector: 'a.article-preview__link',
    imageSelector: 'img.article-preview__image',
    dateSelector: 'time.article-preview__date',
    baseUrl: 'https://www.bndestem.nl'
  },
  {
    name: 'Omroep Brabant',
    searchUrl: '/api/omroep/zoeken/?query=',
    articleSelector: '.article-card',
    titleSelector: '.article-card__title',
    summarySelector: '.article-card__description',
    linkSelector: '.article-card__link',
    imageSelector: '.article-card__image img',
    dateSelector: '.article-card__date',
    baseUrl: 'https://www.omroepbrabant.nl'
  },
  {
    name: 'Brabants Dagblad',
    searchUrl: '/api/bd/zoeken/?query=',
    articleSelector: 'article.article-preview',
    titleSelector: 'h3.article-preview__title',
    summarySelector: 'p.article-preview__intro',
    linkSelector: 'a.article-preview__link',
    imageSelector: 'img.article-preview__image',
    dateSelector: 'time.article-preview__date',
    baseUrl: 'https://www.bd.nl'
  }
];

const searchSource = async (source: NewsSource, location: Location): Promise<NewsArticle[]> => {
  try {
    const searchQuery = `${location.city} ${location.region}`;
    const response = await fetch(`${source.searchUrl}${encodeURIComponent(searchQuery)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Check for privacy consent page
    if (html.includes('myprivacy.dpgmedia.nl/consent')) {
      console.warn(`${source.name} requires privacy consent, skipping...`);
      return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const articles = Array.from(doc.querySelectorAll(source.articleSelector))
      .map(article => {
        const titleElement = article.querySelector(source.titleSelector);
        const summaryElement = article.querySelector(source.summarySelector);
        const linkElement = article.querySelector(source.linkSelector);
        const imageElement = article.querySelector(source.imageSelector);
        const dateElement = article.querySelector(source.dateSelector);

        if (!titleElement || !linkElement) return null;

        const title = titleElement.textContent?.trim() || '';
        const summary = summaryElement?.textContent?.trim() || '';
        const link = linkElement.getAttribute('href') || '';
        const image = imageElement?.getAttribute('src') || '';
        const date = dateElement?.textContent?.trim() || new Date().toISOString();

        const fullLink = link.startsWith('http') ? link : `${source.baseUrl}${link}`;
        const fullImage = image.startsWith('http') ? image : `${source.baseUrl}${image}`;

        return {
          id: createUniqueId(fullLink),
          title,
          content: summary,
          summary,
          thumbnail: fullImage,
          location: location.city,
          publishedAt: date,
          source: source.name,
          author: 'Onbekend',
          category: 'lokaal',
          relevanceScore: 5 // Local news sources are highly relevant
        };
      })
      .filter((article): article is NewsArticle => article !== null);

    return articles;
  } catch (error) {
    console.error(`Error searching source ${source.name}:`, error);
    return [];
  }
};

export const fetchLocalNews = async (location: Location): Promise<NewsArticle[]> => {
  try {
    const allArticles = await Promise.all(
      NEWS_SOURCES.map(source => searchSource(source, location))
    );

    return allArticles.flat();
  } catch (error) {
    console.error('Error fetching local news:', error);
    return [];
  }
}; 