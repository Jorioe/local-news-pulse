import { NewsArticle, Location } from '../types/news';
import { fetchLocalNews } from './localNewsService';

// API Keys should be stored in environment variables
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const WORLD_NEWS_API_KEY = import.meta.env.VITE_WORLD_NEWS_API_KEY;
const MEDIASTACK_API_KEY = import.meta.env.VITE_MEDIASTACK_API_KEY;
const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY;
const THE_NEWS_API_KEY = import.meta.env.VITE_THE_NEWS_API_KEY;
const CURRENTS_API_KEY = import.meta.env.VITE_CURRENTS_API_KEY;
const NEWSDATA_API_KEY = import.meta.env.VITE_NEWSDATA_API_KEY;
const LUMENFEED_API_KEY = import.meta.env.VITE_LUMENFEED_API_KEY;

// Helper function to create a unique ID
const createUniqueId = (url: string): string => btoa(url).slice(0, 32);

// Helper function to determine news category based on keywords or source
const determineCategory = (
  title: string,
  description: string | undefined,
  source: string | { name: string }
): 'lokaal' | 'regionaal' | 'belangrijk' => {
  const localKeywords = ['gemeente', 'lokaal', 'buurt', 'wijk', 'stad', 'dorp'];
  const regionalKeywords = ['provincie', 'regio', 'regionaal', 'district'];
  const importantKeywords = ['breaking', 'urgent', 'belangrijk', 'crisis', 'noodgeval'];

  const text = `${title} ${description || ''} ${typeof source === 'string' ? source : source.name}`.toLowerCase();

  if (importantKeywords.some(keyword => text.includes(keyword))) {
    return 'belangrijk';
  }
  if (localKeywords.some(keyword => text.includes(keyword))) {
    return 'lokaal';
  }
  if (regionalKeywords.some(keyword => text.includes(keyword))) {
    return 'regionaal';
  }

  return 'lokaal'; // Default category
};

// Helper function to check if an article is relevant to the location
const isArticleRelevantToLocation = (
  articleText: string,
  location: Location
): boolean => {
  const searchText = articleText.toLowerCase();
  const cityName = location.city.toLowerCase();
  const regionName = location.region.toLowerCase();
  
  // Direct matches for city and region
  const hasCityMatch = searchText.includes(cityName);
  const hasRegionMatch = searchText.includes(regionName);
  
  // Get surrounding words for context (to avoid partial matches)
  const words = searchText.split(/\s+/);
  const cityIndex = words.findIndex(word => word.includes(cityName));
  const regionIndex = words.findIndex(word => word.includes(regionName));
  
  // Check for surrounding context words that might indicate location relevance
  const locationContextWords = ['in', 'bij', 'nabij', 'gemeente', 'stad', 'dorp', 'regio', 'omgeving', 'provincie'];
  
  const hasLocationContext = locationContextWords.some(context => {
    if (cityIndex !== -1) {
      const prevWord = words[cityIndex - 1];
      return prevWord && context === prevWord;
    }
    if (regionIndex !== -1) {
      const prevWord = words[regionIndex - 1];
      return prevWord && context === prevWord;
    }
    return false;
  });

  // Check for nearby cities/regions that would indicate wrong location
  const wrongLocationIndicators = (articleText.match(/(?:in|bij|nabij|gemeente|stad|dorp)\s+([A-Z][a-z]+)/g) || [])
    .map(match => match.split(/\s+/).pop()?.toLowerCase() || '')
    .filter(loc => loc && loc !== cityName && loc !== regionName);

  // If we find other location indicators and our target location isn't prominently featured,
  // it's probably not relevant
  if (wrongLocationIndicators.length > 0 && !hasLocationContext) {
    return false;
  }

  // Strong match: has both city and region with proper context
  if (hasCityMatch && hasRegionMatch && hasLocationContext) {
    return true;
  }

  // Good match: has city name with proper context
  if (hasCityMatch && hasLocationContext) {
    return true;
  }

  // Decent match: has region with proper context and no other competing locations
  if (hasRegionMatch && hasLocationContext && wrongLocationIndicators.length === 0) {
    return true;
  }

  // Weak match: has city or region in title specifically (more weight on title matches)
  const titleMatch = (article: any) => {
    const title = article.title.toLowerCase();
    return title.includes(cityName) || title.includes(regionName);
  };

  return false;
};

interface BaseArticle {
  title: string;
  description?: string;
  content?: string;
  source: string | { name: string };
}

// Helper function to score article relevance
const getArticleRelevanceScore = (
  article: BaseArticle,
  location: Location
): number => {
  const text = `${article.title} ${article.description || ''} ${article.content || ''}`.toLowerCase();
  const cityName = location.city.toLowerCase();
  const regionName = location.region.toLowerCase();
  
  let score = 0;
  
  // Title matches are most important
  if (article.title.toLowerCase().includes(cityName)) score += 5;
  if (article.title.toLowerCase().includes(regionName)) score += 3;
  
  // Content matches
  if (text.includes(cityName)) score += 2;
  if (text.includes(regionName)) score += 1;
  
  // Boost score for articles with location context
  const locationContextWords = ['in', 'bij', 'nabij', 'gemeente', 'stad', 'dorp', 'regio', 'omgeving', 'provincie'];
  locationContextWords.forEach(context => {
    if (text.includes(`${context} ${cityName}`)) score += 2;
    if (text.includes(`${context} ${regionName}`)) score += 1;
  });
  
  // Penalize for mentions of other cities/regions
  const otherLocations = (text.match(/(?:in|bij|nabij|gemeente|stad|dorp)\s+([A-Z][a-z]+)/g) || [])
    .map(match => match.split(/\s+/).pop()?.toLowerCase() || '')
    .filter(loc => loc && loc !== cityName && loc !== regionName);
  
  score -= otherLocations.length;
  
  return score;
};

// Helper function to get local news sources for a region
const getLocalNewsSources = (region: string): string[] => {
  const sourceMap: { [key: string]: string[] } = {
    'Noord-Brabant': [
      'bd.nl',
      'omroepbrabant.nl',
      'brabant.nl',
      'brabantsdagblad.nl',
      'eindhovensdagblad.nl',
      'bndestem.nl',
      'brabantnieuws.net',
      'inbrabant.nl'
    ],
    'Gelderland': [
      'gelderlander.nl',
      'omroepgelderland.nl',
      'gelderland.nl',
      'degelderlander.nl'
    ],
    'Zuid-Holland': [
      'rijnmond.nl',
      'ad.nl',
      'omroepwest.nl',
      'zuid-holland.nl',
      'dehavenloods.nl',
      'hetkompassliedrecht.nl'
    ],
    'Noord-Holland': [
      'nhnieuws.nl',
      'noordhollandsdagblad.nl',
      'rtvnh.nl',
      'noord-holland.nl',
      'haarlemsdagblad.nl'
    ],
    'Utrecht': [
      'rtvutrecht.nl',
      'utrecht.nl',
      'ad.nl/utrecht',
      'duic.nl',
      'utrecht.nieuws.nl'
    ],
    'Friesland': [
      'omropfryslan.nl',
      'friesland.nl',
      'lc.nl',
      'waldnet.nl',
      'friesnieuws.nl'
    ],
    'Groningen': [
      'rtvnoord.nl',
      'groningen.nl',
      'dvhn.nl',
      'sikkom.nl',
      'groningsnieuws.nl'
    ],
    'Drenthe': [
      'rtvdrenthe.nl',
      'drenthe.nl',
      'dvhn.nl',
      'dekrantvanmiddendrenthe.nl'
    ],
    'Overijssel': [
      'rtvoost.nl',
      'overijssel.nl',
      'tubantia.nl',
      'destentor.nl'
    ],
    'Flevoland': [
      'omroepflevoland.nl',
      'flevoland.nl',
      'denoordoostpolder.nl'
    ],
    'Zeeland': [
      'omroepzeeland.nl',
      'zeeland.nl',
      'pzc.nl',
      'internetbode.nl'
    ],
    'Limburg': [
      'l1.nl',
      'limburg.nl',
      'limburger.nl',
      '1limburg.nl'
    ]
  };

  return sourceMap[region] || [];
};

// Helper function to check if an article is local to a specific city
const isLocalArticle = (
  articleText: string,
  location: Location
): boolean => {
  const searchText = articleText.toLowerCase();
  const cityName = location.city.toLowerCase();
  
  // Get surrounding words for context
  const words = searchText.split(/\s+/);
  const cityIndex = words.findIndex(word => word.includes(cityName));
  
  // Check for surrounding context words that indicate local relevance
  const localContextWords = ['in', 'bij', 'nabij', 'gemeente', 'stad', 'dorp', 'wijk', 'buurt'];
  
  const hasStrongLocalContext = localContextWords.some(context => {
    if (cityIndex !== -1) {
      const prevWord = words[cityIndex - 1];
      return prevWord && context === prevWord;
    }
    return false;
  });

  // Check if the article mentions other cities more prominently
  const otherCityMatches = (articleText.match(/(?:in|bij|nabij|gemeente|stad|dorp)\s+([A-Z][a-z]+)/g) || [])
    .map(match => match.split(/\s+/).pop()?.toLowerCase() || '')
    .filter(loc => loc && loc !== cityName);

  return hasStrongLocalContext && otherCityMatches.length === 0;
};

// Helper function to check if an article is regional
const isRegionalArticle = (
  articleText: string,
  location: Location
): boolean => {
  const searchText = articleText.toLowerCase();
  const regionName = location.region.toLowerCase();
  
  // Get surrounding words for context
  const words = searchText.split(/\s+/);
  const regionIndex = words.findIndex(word => word.includes(regionName));
  
  // Check for surrounding context words that indicate regional relevance
  const regionalContextWords = ['provincie', 'regio', 'regionaal', 'district', 'omgeving'];
  
  const hasRegionalContext = regionalContextWords.some(context => {
    if (regionIndex !== -1) {
      const prevWord = words[regionIndex - 1];
      return prevWord && context === prevWord;
    }
    return false;
  });

  return hasRegionalContext || searchText.includes(regionName);
};

interface NewsAPIArticle {
  url: string;
  title: string;
  content: string;
  description: string;
  urlToImage: string;
  publishedAt: string;
  source: { name: string };
  author?: string;
}

interface GNewsArticle {
  url: string;
  title: string;
  content: string;
  description: string;
  image: string;
  publishedAt: string;
  source: { name: string };
  author?: string;
}

interface MediaStackArticle {
  url: string;
  title: string;
  description: string;
  image: string;
  published_at: string;
  source: string;
  author?: string;
}

interface CurrentsArticle {
  url: string;
  title: string;
  description: string;
  image: string;
  published: string;
  source: string;
  author?: string;
}

const fetchNewsAPI = async (location: Location): Promise<NewsArticle[]> => {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?` +
      new URLSearchParams({
        q: `("${location.city}" OR "${location.region}") AND (nederland OR dutch OR netherlands)`,
        language: 'nl',
        sortBy: 'publishedAt',
        apiKey: NEWS_API_KEY
      })
    );

    if (!response.ok) {
      throw new Error(`NewsAPI responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.articles || !Array.isArray(data.articles)) {
      throw new Error('Invalid response format from NewsAPI');
    }

    return data.articles
      .map((article: NewsAPIArticle) => ({
        id: createUniqueId(article.url),
        title: article.title,
        content: article.content,
        summary: article.description,
        thumbnail: article.urlToImage,
        location: location.city,
        publishedAt: article.publishedAt,
        source: article.source.name,
        author: article.author || 'Onbekend',
        category: determineCategory(article.title, article.description, article.source.name),
        relevanceScore: getArticleRelevanceScore(article, location)
      }))
      .filter((article: NewsArticle) => 
        isArticleRelevantToLocation(
          `${article.title} ${article.summary} ${article.content}`,
          location
        )
      );
  } catch (error) {
    console.error('NewsAPI Error:', error);
    return [];
  }
};

const fetchWorldNews = async (location: Location): Promise<NewsArticle[]> => {
  try {
    const localSources = getLocalNewsSources(location.region);
    const sourceQuery = localSources.length > 0 ? 
      ` OR site:(${localSources.join(' OR ')})` : '';

    const response = await fetch(
      `https://api.worldnewsapi.com/search-news?` +
      new URLSearchParams({
        text: `"${location.city}" "${location.region}" "${location.city}, ${location.region}"${sourceQuery}`,
        language: 'nl',
        'api-key': WORLD_NEWS_API_KEY
      }).toString()
    );
    const data = await response.json();
    
    return data.news
      .map((article: any) => {
        const fullText = `${article.title} ${article.summary} ${article.text}`;
        const isLocal = isLocalArticle(fullText, location);
        const isRegional = !isLocal && isRegionalArticle(fullText, location);
        
        return {
          id: createUniqueId(article.url),
          title: article.title,
          content: article.text,
          summary: article.summary,
          thumbnail: article.image,
          location: location.city,
          publishedAt: article.publish_date,
          source: article.source_name,
          author: article.author || 'Onbekend',
          category: isLocal ? 'lokaal' : (isRegional ? 'regionaal' : 'belangrijk'),
          relevanceScore: getArticleRelevanceScore(article, location)
        };
      })
      .filter(article => article.relevanceScore > 0);
  } catch (error) {
    console.error('WorldNews Error:', error);
    return [];
  }
};

const fetchLumenFeed = async (location: Location): Promise<NewsArticle[]> => {
  try {
    const response = await fetch(
      `https://api.lumenfeed.com/v1/news?` +
      new URLSearchParams({
        query: `${location.city} ${location.region}`,
        language: 'nl',
        apiKey: LUMENFEED_API_KEY
      })
    );
    const data = await response.json();
    
    return data.articles.map((article: any) => ({
      id: createUniqueId(article.url),
      title: article.title,
      content: article.content,
      summary: article.description,
      thumbnail: article.image,
      location: location.city,
      publishedAt: article.publishedAt,
      source: article.source,
      author: article.author || 'Onbekend',
      category: determineCategory(article.title, article.description, article.source)
    }));
  } catch (error) {
    console.error('LumenFeed Error:', error);
    return [];
  }
};

const fetchMediaStack = async (location: Location): Promise<NewsArticle[]> => {
  try {
    const response = await fetch(
      `/api/mediastack/news?` +
      new URLSearchParams({
        keywords: `${location.city} ${location.region}`,
        languages: 'nl',
        access_key: MEDIASTACK_API_KEY
      })
    );

    if (!response.ok) {
      throw new Error(`MediaStack responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from MediaStack');
    }

    return data.data
      .map((article: MediaStackArticle) => ({
        id: createUniqueId(article.url),
        title: article.title,
        content: article.description,
        summary: article.description,
        thumbnail: article.image,
        location: location.city,
        publishedAt: article.published_at,
        source: article.source,
        author: article.author || 'Onbekend',
        category: determineCategory(article.title, article.description, article.source),
        relevanceScore: getArticleRelevanceScore(article, location)
      }))
      .filter((article: NewsArticle) => 
        isArticleRelevantToLocation(
          `${article.title} ${article.summary} ${article.content}`,
          location
        )
      );
  } catch (error) {
    console.error('MediaStack Error:', error);
    return [];
  }
};

const fetchGNews = async (location: Location): Promise<NewsArticle[]> => {
  try {
    const response = await fetch(
      `/api/gnews/search?` +
      new URLSearchParams({
        q: `${location.city} ${location.region}`,
        lang: 'nl',
        country: 'nl',
        apikey: GNEWS_API_KEY
      })
    );

    if (!response.ok) {
      throw new Error(`GNews responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.articles || !Array.isArray(data.articles)) {
      throw new Error('Invalid response format from GNews');
    }

    return data.articles
      .map((article: GNewsArticle) => ({
        id: createUniqueId(article.url),
        title: article.title,
        content: article.content,
        summary: article.description,
        thumbnail: article.image,
        location: location.city,
        publishedAt: article.publishedAt,
        source: article.source.name,
        author: article.author || 'Onbekend',
        category: determineCategory(article.title, article.description, article.source.name),
        relevanceScore: getArticleRelevanceScore(article, location)
      }))
      .filter((article: NewsArticle) => 
        isArticleRelevantToLocation(
          `${article.title} ${article.summary} ${article.content}`,
          location
        )
      );
  } catch (error) {
    console.error('GNews Error:', error);
    return [];
  }
};

const fetchTheNews = async (location: Location): Promise<NewsArticle[]> => {
  try {
    const response = await fetch(
      `https://api.thenewsapi.com/v1/news/all?` +
      new URLSearchParams({
        search: `${location.city} ${location.region}`,
        language: 'nl',
        api_token: THE_NEWS_API_KEY
      })
    );
    const data = await response.json();
    
    return data.data.map((article: any) => ({
      id: createUniqueId(article.url),
      title: article.title,
      content: article.body,
      summary: article.description,
      thumbnail: article.image_url,
      location: location.city,
      publishedAt: article.published_at,
      source: article.source,
      author: article.author || 'Onbekend',
      category: determineCategory(article.title, article.description, article.source)
    }));
  } catch (error) {
    console.error('TheNews Error:', error);
    return [];
  }
};

const fetchCurrents = async (location: Location): Promise<NewsArticle[]> => {
  try {
    const response = await fetch(
      `/api/currents/search?` +
      new URLSearchParams({
        keywords: `${location.city} ${location.region}`,
        language: 'nl',
        apiKey: CURRENTS_API_KEY
      })
    );

    if (!response.ok) {
      throw new Error(`Currents responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.news || !Array.isArray(data.news)) {
      throw new Error('Invalid response format from Currents');
    }

    return data.news
      .map((article: CurrentsArticle) => ({
        id: createUniqueId(article.url),
        title: article.title,
        content: article.description,
        summary: article.description,
        thumbnail: article.image,
        location: location.city,
        publishedAt: article.published,
        source: article.source,
        author: article.author || 'Onbekend',
        category: determineCategory(article.title, article.description, article.source),
        relevanceScore: getArticleRelevanceScore(article, location)
      }))
      .filter((article: NewsArticle) => 
        isArticleRelevantToLocation(
          `${article.title} ${article.summary} ${article.content}`,
          location
        )
      );
  } catch (error) {
    console.error('Currents Error:', error);
    return [];
  }
};

const fetchNewsData = async (location: Location): Promise<NewsArticle[]> => {
  try {
    const response = await fetch(
      `https://newsdata.io/api/1/news?` +
      new URLSearchParams({
        q: `${location.city} ${location.region}`,
        language: 'nl',
        apikey: NEWSDATA_API_KEY
      })
    );
    const data = await response.json();
    
    return data.results.map((article: any) => ({
      id: createUniqueId(article.link),
      title: article.title,
      content: article.content,
      summary: article.description,
      thumbnail: article.image_url,
      location: location.city,
      publishedAt: article.pubDate,
      source: article.source_id,
      author: article.creator?.[0] || 'Onbekend',
      category: determineCategory(article.title, article.description, article.source_id)
    }));
  } catch (error) {
    console.error('NewsData Error:', error);
    return [];
  }
};

// Helper function to remove duplicate articles
const removeDuplicates = (articles: NewsArticle[]): NewsArticle[] => {
  const seen = new Map<string, NewsArticle>();
  
  articles.forEach(article => {
    const key = article.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = seen.get(key);
    
    if (!existing || article.relevanceScore > existing.relevanceScore) {
      seen.set(key, article);
    }
  });
  
  return Array.from(seen.values());
};

// Helper function to sort articles by date
const sortArticles = (articles: NewsArticle[]): NewsArticle[] => {
  return articles.sort((a, b) => {
    // Calculate time difference in hours
    const hoursDiff = (new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()) / (1000 * 60 * 60);
    
    // If articles are from similar time (within 12 hours), sort by relevance
    if (Math.abs(hoursDiff) < 12) {
      return b.relevanceScore - a.relevanceScore;
    }
    
    // Otherwise sort by date
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
};

export const fetchAllNews = async (location: Location): Promise<NewsArticle[]> => {
  try {
    const [
      newsApiArticles,
      worldNewsArticles,
      lumenFeedArticles,
      mediaStackArticles,
      gNewsArticles,
      theNewsArticles,
      currentsArticles,
      newsDataArticles,
      localNewsArticles
    ] = await Promise.allSettled([
      fetchNewsAPI(location),
      fetchWorldNews(location),
      fetchLumenFeed(location),
      fetchMediaStack(location),
      fetchGNews(location),
      fetchTheNews(location),
      fetchCurrents(location),
      fetchNewsData(location),
      fetchLocalNews(location)
    ]);

    const allArticles: NewsArticle[] = [
      ...(localNewsArticles.status === 'fulfilled' ? localNewsArticles.value : []),
      ...(newsApiArticles.status === 'fulfilled' ? newsApiArticles.value : []),
      ...(worldNewsArticles.status === 'fulfilled' ? worldNewsArticles.value : []),
      ...(lumenFeedArticles.status === 'fulfilled' ? lumenFeedArticles.value : []),
      ...(mediaStackArticles.status === 'fulfilled' ? mediaStackArticles.value : []),
      ...(gNewsArticles.status === 'fulfilled' ? gNewsArticles.value : []),
      ...(theNewsArticles.status === 'fulfilled' ? theNewsArticles.value : []),
      ...(currentsArticles.status === 'fulfilled' ? currentsArticles.value : []),
      ...(newsDataArticles.status === 'fulfilled' ? newsDataArticles.value : [])
    ];

    // Remove duplicates and sort by both relevance and date
    const uniqueArticles = removeDuplicates(allArticles);
    const sortedArticles = sortArticles(uniqueArticles);

    return sortedArticles;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}; 