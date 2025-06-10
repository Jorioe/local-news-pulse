import { XMLParser } from 'fast-xml-parser';
import { getRelativeTime } from '../utils/dateUtils';
import { Location, NewsArticle } from '../types/news';

// API Keys should be stored in environment variables
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

// Helper function to generate a stable article ID
const generateArticleId = (url: string, publishedAt: string): string => {
  // Use only the first 8 chars of the hash for readability
  const hash = btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  // Use the timestamp from publishedAt for stability
  const timestamp = new Date(publishedAt).getTime();
  return `${hash}-${timestamp}`;
};

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = 'news-cache-';

interface CacheEntry {
  timestamp: number;
  articles: NewsArticle[];
  location: string;
}

// In-memory cache
let memoryCache: CacheEntry | null = null;

// Proxy configuration - using a more reliable proxy
const CORS_PROXY = 'https://corsproxy.io/?';

// Local news sources mapping by region
const LOCAL_NEWS_SOURCES: { [key: string]: Array<{ name: string; rssUrl: string; baseUrl: string }> } = {
  'Noord-Brabant': [
    {
      name: 'Omroep Brabant',
      rssUrl: 'https://www.omroepbrabant.nl/rss',
      baseUrl: 'https://www.omroepbrabant.nl'
    },
    {
      name: 'BN DeStem Moerdijk',
      rssUrl: 'https://www.bndestem.nl/moerdijk/rss.xml',
      baseUrl: 'https://www.bndestem.nl'
    },
    {
      name: 'BN DeStem Regio',
      rssUrl: 'https://www.bndestem.nl/regio/rss.xml',
      baseUrl: 'https://www.bndestem.nl'
    },
    {
      name: 'Brabants Dagblad',
      rssUrl: 'https://www.bd.nl/moerdijk/rss.xml',
      baseUrl: 'https://www.bd.nl'
    },
    {
      name: 'Moerdijk Nieuws',
      rssUrl: 'https://moerdijk.nieuws.nl/feed/',
      baseUrl: 'https://moerdijk.nieuws.nl'
    },
    {
      name: 'Internet Bode',
      rssUrl: 'https://internetbode.nl/moerdijk/rss',
      baseUrl: 'https://internetbode.nl'
    }
  ],
  'Zuid-Holland': [
    {
      name: 'RTV Rijnmond',
      rssUrl: 'https://rijnmond.nl/rss',
      baseUrl: 'https://rijnmond.nl'
    },
    {
      name: 'AD Rotterdam',
      rssUrl: 'https://www.ad.nl/rotterdam/rss.xml',
      baseUrl: 'https://www.ad.nl'
    },
    {
      name: 'Omroep West',
      rssUrl: 'https://www.omroepwest.nl/nieuws/rss.xml',
      baseUrl: 'https://www.omroepwest.nl'
    }
  ],
  'Gelderland': [
    {
      name: 'Omroep Gelderland',
      rssUrl: 'https://www.omroepgelderland.nl/nieuws/rss',
      baseUrl: 'https://www.omroepgelderland.nl'
    }
  ],
  'Utrecht': [
    {
      name: 'RTV Utrecht',
      rssUrl: 'https://rtvutrecht.nl/feed/rss.xml',
      baseUrl: 'https://rtvutrecht.nl'
    }
  ],
  'Overijssel': [
    {
      name: 'RTV Oost',
      rssUrl: 'https://www.rtvoost.nl/nieuws/rss',
      baseUrl: 'https://www.rtvoost.nl'
    }
  ],
  'Friesland': [
    {
      name: 'Omrop Fryslân',
      rssUrl: 'https://www.omropfryslan.nl/nieuws/rss.xml',
      baseUrl: 'https://www.omropfryslan.nl'
    }
  ],
  'Groningen': [
    {
      name: 'RTV Noord',
      rssUrl: 'https://www.rtvnoord.nl/nieuws/rss',
      baseUrl: 'https://www.rtvnoord.nl'
    }
  ],
  'Drenthe': [
    {
      name: 'RTV Drenthe',
      rssUrl: 'https://www.rtvdrenthe.nl/nieuws/rss',
      baseUrl: 'https://www.rtvdrenthe.nl'
    }
  ],
  'Zeeland': [
    {
      name: 'Omroep Zeeland',
      rssUrl: 'https://www.omroepzeeland.nl/nieuws/rss',
      baseUrl: 'https://www.omroepzeeland.nl'
    }
  ],
  'Flevoland': [
    {
      name: 'Omroep Flevoland',
      rssUrl: 'https://www.omroepflevoland.nl/nieuws/rss',
      baseUrl: 'https://www.omroepflevoland.nl'
    }
  ],
  'Limburg': [
    {
      name: 'L1',
      rssUrl: 'https://l1.nl/feed/',
      baseUrl: 'https://l1.nl'
    }
  ],
  'Noord-Holland': [
    {
      name: 'NH Nieuws',
      rssUrl: 'https://www.nhnieuws.nl/feed/rss.xml',
      baseUrl: 'https://www.nhnieuws.nl'
    }
  ]
};

// National news sources
const NATIONAL_NEWS_SOURCES = [
  {
    name: 'NOS',
    rssUrl: 'https://feeds.nos.nl/nosnieuwsalgemeen',
    baseUrl: 'https://nos.nl'
  },
  {
    name: 'NU.nl',
    rssUrl: 'https://www.nu.nl/rss/algemeen',
    baseUrl: 'https://www.nu.nl'
  }
];

// Helper functions
const getCacheKey = (location: Location): string => {
  const key = `${CACHE_KEY_PREFIX}${location.city}-${location.region}`;
  console.log('Generated cache key:', key);
  return key;
};

const isCacheValid = (cache: CacheEntry): boolean => {
  const isValid = Date.now() - cache.timestamp < CACHE_DURATION;
  console.log('Cache valid:', isValid, 'Age:', (Date.now() - cache.timestamp) / 1000, 'seconds');
  return isValid;
};

// Helper function to format relative time
const formatRelativeTime = (publishedAt: string): string => {
  const now = new Date();
  const published = new Date(publishedAt);
  const diffInSeconds = Math.floor((now.getTime() - published.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconden geleden`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minuut' : 'minuten'} geleden`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'uur' : 'uur'} geleden`;
  }
  
  return new Date(publishedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
};

// Helper function to check if text contains a complete word match
const hasCompleteWordMatch = (text: string, word: string): boolean => {
  // Handle special characters and make word boundaries work with Dutch characters
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|[^a-zA-ZÀ-ÿ])(${escapedWord})(?:$|[^a-zA-ZÀ-ÿ])`, 'i');
  return regex.test(text);
};

// Helper function to get nearby places for better context
const getNearbyPlaces = (location: Location): string[] => {
  const nearbyPlacesMap: { [key: string]: string[] } = {
    'zevenbergen': [
      'moerdijk', 'klundert', 'etten-leur', 'breda', 'roosendaal',
      'standdaarbuiten', 'zevenbergschen hoek', 'langeweg', 'zevenbergen',
      'gemeente moerdijk', 'industrieterrein moerdijk', 'moerdijk gemeente',
      'west-brabant', 'noord-brabant'
    ],
    'moerdijk': [
      'zevenbergen', 'klundert', 'willemstad', 'standdaarbuiten',
      'zevenbergschen hoek', 'langeweg', 'gemeente moerdijk',
      'industrieterrein moerdijk', 'west-brabant', 'noord-brabant'
    ]
  };
  
  const cityKey = location.city.toLowerCase();
  const defaultPlaces = [
    location.city.toLowerCase(),
    location.region.toLowerCase(),
    `gemeente ${location.city.toLowerCase()}`,
    `${location.city.toLowerCase()} gemeente`
  ];
  return nearbyPlacesMap[cityKey] || defaultPlaces;
};

// Helper function to determine article relevance score
const calculateRelevanceScore = (article: NewsArticle, location: Location): number => {
  const text = `${article.title} ${article.summary} ${article.content}`.toLowerCase();
  const cityName = location.city.toLowerCase();
  const regionName = location.region.toLowerCase();
  let score = 0;
  
  // Boost score for local news sources based on region
  if (LOCAL_NEWS_SOURCES[location.region]?.some(source => 
    article.source.toLowerCase().includes(source.name.toLowerCase())
  )) {
    score += 30;
  }

  // Check for city name in title (highest importance)
  if (hasCompleteWordMatch(article.title.toLowerCase(), cityName)) {
    score += 50;
  }

  // Check for region name in title
  if (hasCompleteWordMatch(article.title.toLowerCase(), regionName)) {
    score += 20;
  }

  // Check for city name in content
  const cityMatches = (text.match(new RegExp(`\\b${cityName}\\b`, 'gi')) || []).length;
  score += cityMatches * 10;

  // Check for region name in content
  const regionMatches = (text.match(new RegExp(`\\b${regionName}\\b`, 'gi')) || []).length;
  score += regionMatches * 5;

  // Check for nearby places
  const nearbyPlaces = getNearbyPlaces(location);
  const nearbyMatches = nearbyPlaces.reduce((count, place) => {
    const matches = (text.match(new RegExp(`\\b${place}\\b`, 'gi')) || []).length;
    // Give more weight to gemeente matches
    if (place.includes('gemeente')) {
      return count + (matches * 8);
    }
    return count + (matches * 5);
  }, 0);
  score += nearbyMatches;

  // Penalize articles about investment companies (specific to Zevenbergen)
  if (cityName === 'zevenbergen' && 
      (text.includes('capital investments') || 
       text.includes('stock') || 
       text.includes('investment llc') || 
       text.includes('holdings'))) {
    if (!text.includes('gemeente zevenbergen') && 
        !text.includes('zevenbergen, nederland')) {
      score -= 100;
    }
  }

  // Boost recent articles
  const articleDate = new Date(article.publishedAt);
  const hoursSincePublished = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60);
  if (hoursSincePublished < 24) {
    score += 20;
  } else if (hoursSincePublished < 48) {
    score += 10;
  }

  // Penalize articles that are too old (more than 2 weeks)
  if (hoursSincePublished > 336) { // 14 days * 24 hours
    score -= 30;
  }

  // Boost articles with images
  if (article.thumbnail && !article.thumbnail.includes('placeholder-news.jpg')) {
    score += 5;
  }

  // Boost articles with substantial content
  if (article.content && article.content.length > 500) {
    score += 5;
  }

  return Math.max(0, score);
};

const extractThumbnail = (item: any, content: string): string => {
  // Try all possible RSS image fields
  let thumbnail = item.enclosure?.['@_url'] || 
                 item['media:content']?.['@_url'] ||
                 item['media:thumbnail']?.['@_url'] ||
                 item.image?.url ||
                 item.image ||
                 item['media:group']?.['media:thumbnail']?.['@_url'] ||
                 item['media:group']?.['media:content']?.['@_url'];

  // If we have multiple media items, try to find the best one
  if (item['media:content'] && Array.isArray(item['media:content'])) {
    const mediaItems = item['media:content'];
    // Try to find an image with good dimensions
    const goodImage = mediaItems.find(media => 
      media['@_medium'] === 'image' && 
      media['@_width'] && 
      media['@_height'] && 
      parseInt(media['@_width']) >= 300
    );
    if (goodImage) {
      thumbnail = goodImage['@_url'];
    } else if (mediaItems[0]) {
      // Fallback to first image
      thumbnail = mediaItems[0]['@_url'];
    }
  }

  // If still no thumbnail, try to extract from content
  if (!thumbnail && content) {
    // Try to find image tags
    const imgMatches = content.match(/<img[^>]+src="([^">]+)"/ig);
    if (imgMatches) {
      // Try to find a good quality image
      const goodImage = imgMatches
        .map(img => img.match(/src="([^">]+)"/i)?.[1])
        .find(src => src && !src.includes('icon') && !src.includes('logo'));
      if (goodImage) {
        thumbnail = goodImage;
      }
    }

    // Try to find og:image meta tags
    if (!thumbnail) {
      const ogMatch = content.match(/<meta[^>]+property="og:image"[^>]+content="([^">]+)"/i);
      if (ogMatch) {
        thumbnail = ogMatch[1];
      }
    }
  }

  // Clean up the URL
  if (thumbnail) {
    // Ensure the URL is absolute
    if (thumbnail.startsWith('//')) {
      thumbnail = 'https:' + thumbnail;
    } else if (thumbnail.startsWith('/')) {
      const baseUrl = new URL(item.link || item.guid).origin;
      thumbnail = baseUrl + thumbnail;
    }

    // Remove any tracking parameters
    try {
      const url = new URL(thumbnail);
      url.search = '';
      thumbnail = url.toString();
    } catch (e) {
      console.warn('Failed to clean thumbnail URL:', e);
    }
  }

  // Fallback to placeholder if no image found or URL is invalid
  return thumbnail || '/placeholder-news.jpg';
};

// Function to fetch RSS feeds with better error handling and caching
const fetchRSSFeeds = async (location: Location): Promise<NewsArticle[]> => {
  try {
    console.log('Starting fetchRSSFeeds for location:', location);
    const articles: NewsArticle[] = [];
    const sources = [
      ...(LOCAL_NEWS_SOURCES[location.region] || []),
      ...NATIONAL_NEWS_SOURCES
    ];
    
    console.log('Available sources for region:', location.region);
    console.log('Sources:', sources);

    if (sources.length === 0) {
      console.warn('No sources found for region:', location.region);
      return [];
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      removeNSPrefix: true,
      parseAttributeValue: true,
      allowBooleanAttributes: true
    });

    for (const source of sources) {
      try {
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(source.rssUrl)}`;
        console.log(`Fetching RSS feed from ${source.name} through proxy: ${proxyUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`Failed to fetch RSS feed from ${source.name}: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error('Error response:', errorText.substring(0, 200));
          continue;
        }

        const xmlText = await response.text();
        
        // Skip if the response is empty
        if (!xmlText.trim()) {
          console.error(`Empty response from ${source.name}`);
          continue;
        }

        // Try to parse the XML
        try {
          const result = parser.parse(xmlText);
          console.log(`Parsed XML from ${source.name}:`, result);
          
          // Handle different RSS feed structures
          const items = result.rss?.channel?.item || 
                       result.feed?.entry || 
                       result.feed?.item ||
                       [];

          if (!Array.isArray(items)) {
            console.error(`No items found in RSS feed from ${source.name}`);
            console.error('Feed structure:', JSON.stringify(result, null, 2));
            continue;
          }

          console.log(`Found ${items.length} items from ${source.name}`);

          for (const item of items) {
            try {
              const publishedAt = new Date(item.pubDate || item.published || item.date).toISOString();
              const relativeTime = formatRelativeTime(publishedAt);
              
              // Extract content from various possible RSS fields
              const content = item.description || 
                            item['content:encoded'] || 
                            item.content?.['#text'] ||
                            item.content ||
                            item.summary ||
                            '';
              
              // Clean up the content
              const cleanContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                                        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

              // Extract thumbnail using our new helper function
              const thumbnail = extractThumbnail(item, cleanContent);

              const article: NewsArticle = {
                id: generateArticleId(item.link || item.guid, publishedAt),
                title: item.title?.['#text'] || item.title || '',
                content: cleanContent,
                summary: cleanContent.replace(/<[^>]+>/g, '').substring(0, 200),
                thumbnail,
                location: location.city,
                publishedAt,
                source: source.name,
                author: item.author || item.creator || source.name,
                category: 'lokaal',
                relevanceScore: 0,
                url: item.link || item.guid || '',
                relativeTime
              };

              // Only add articles with actual content
              if (article.title && article.content && article.url) {
                console.log(`Adding article from ${source.name}:`, article.title);
                articles.push(article);
              } else {
                console.warn(`Skipping article from ${source.name} due to missing required fields:`, {
                  hasTitle: !!article.title,
                  hasContent: !!article.content,
                  hasUrl: !!article.url
                });
              }
            } catch (itemError) {
              console.error(`Error processing item from ${source.name}:`, itemError);
            }
          }
        } catch (parseError) {
          console.error(`Error parsing XML from ${source.name}:`, parseError);
          console.error('XML content:', xmlText.substring(0, 200));
        }
      } catch (sourceError) {
        console.error(`Error fetching RSS feed from ${source.name}:`, sourceError);
      }
    }

    console.log(`Total articles found: ${articles.length}`);
    return articles;
  } catch (error) {
    console.error('Error in fetchRSSFeeds:', error);
    return [];
  }
};

// Main function to fetch news
const fetchNews = async (location: Location): Promise<NewsArticle[]> => {
  try {
    // Build search query
    const cityQuery = `"${location.city}"`;
    const regionQuery = `"${location.region}"`;
    const nearbyPlaces = getNearbyPlaces(location)
      .filter(place => place !== location.city.toLowerCase())
      .map(place => `"${place}"`)
      .join(' OR ');
    
    // Special handling for Zevenbergen to exclude investment news
    const excludeTerms = location.city.toLowerCase() === 'zevenbergen' 
      ? ' -"Capital Investments" -"stock" -"holdings" -"LLC" -"Investment Management" -"Zevenbergen Capital" -"Zevenbergen Growth"' 
      : '';
    
    // Build a more targeted query
    const query = `(${cityQuery} OR (${regionQuery} AND (${nearbyPlaces})))${excludeTerms}`;

    // Use multiple NewsAPI endpoints for better coverage
    const endpoints = [
      'everything',
      'top-headlines'
    ];

    const articles: any[] = [];
    
    for (const endpoint of endpoints) {
    const params = new URLSearchParams({
        q: query,
      sortBy: 'publishedAt',
        language: 'nl',
      pageSize: '100',
        apiKey: NEWS_API_KEY
      });

      if (endpoint === 'top-headlines') {
        params.append('country', 'nl');
      }

      const response = await fetch(
        `https://newsapi.org/v2/${endpoint}?${params}`
      );
      
    if (!response.ok) {
        console.error(`NewsAPI ${endpoint} failed:`, response.statusText);
        continue;
    }

    const data = await response.json();
      articles.push(...data.articles);
    }

    // Remove duplicates based on URL
    const uniqueArticles = Array.from(
      new Map(articles.map(article => [article.url, article])).values()
    );

    return uniqueArticles.map((article: any) => {
      const publishedAt = article.publishedAt;
      const relativeTime = getRelativeTime(publishedAt);
      
        return {
        id: generateArticleId(article.url, publishedAt),
          title: article.title,
        content: article.content || article.description || '',
        summary: article.description || '',
        thumbnail: article.urlToImage || '/placeholder-news.jpg',
          location: location.city,
        publishedAt,
        source: article.source.name,
          author: article.author || 'Unknown',
        category: 'lokaal',
        relevanceScore: 0,
        url: article.url,
        relativeTime
      };
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
};

export type NewsCategory = 'belangrijk' | 'lokaal' | 'regionaal' | 'nationaal';

export interface BaseNewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  thumbnail: string;
  location: string;
  url: string;
  source: string;
  publishedAt: string;
  author?: string;
  relativeTime?: string;
}

export interface NewsArticle extends BaseNewsArticle {
  relevanceScore?: number;
  category?: NewsCategory;
}

export interface ProcessedNewsArticle extends BaseNewsArticle {
  relevanceScore: number;
  category: NewsCategory;
}

// Function to process and sort articles
const processArticles = (articles: NewsArticle[], location: Location): NewsArticle[] => {
  // Remove duplicates based on URL and title similarity
  const uniqueArticles = Array.from(
    new Map(articles.map(article => [article.url, article])).values()
  ).filter((article, index, self) => {
    const similarArticles = self.filter((a, i) => {
      if (i === index) return false;
      const titleSimilarity = (a.title.toLowerCase().includes(article.title.toLowerCase()) ||
                              article.title.toLowerCase().includes(a.title.toLowerCase()));
      return titleSimilarity;
    });
    return similarArticles.length === 0;
  });

  // Define regional terms for Noord-Brabant
  const brabantTerms = [
    'brabant',
    'eindhoven',
    'tilburg',
    'breda',
    'den bosch',
    's-hertogenbosch',
    'roosendaal',
    'bergen op zoom',
    'etten-leur',
    'oosterhout',
    'waalwijk',
    'moerdijk',
    'zevenbergen',
    'klundert',
    'willemstad',
    'fijnaart',
    'standdaarbuiten',
    'noordhoek'
  ];

  // Calculate relevance scores and categorize
  const processedArticles = uniqueArticles.map(article => {
    let relevanceScore = 0;
    let category: 'belangrijk' | 'lokaal' | 'regionaal' = 'regionaal';

    const contentText = `${article.title} ${article.content}`.toLowerCase();
    const source = article.source.toLowerCase();
    
    // Check for local relevance first
    const locationTerms = [
      location.city.toLowerCase(),
      ...(location.nearbyCities || []).map(city => city.toLowerCase())
    ];

    if (locationTerms.some(term => contentText.includes(term))) {
      relevanceScore += 5;
      category = 'lokaal';
    }

    // Check for regional relevance (Noord-Brabant specific)
    const hasRegionalRelevance = brabantTerms.some(term => contentText.includes(term.toLowerCase())) ||
                                source.includes('brabant') ||
                                source.includes('bd.nl') ||
                                source.includes('bndestem');

    if (hasRegionalRelevance) {
      relevanceScore += 3;
      if (category !== 'lokaal') {
        category = 'regionaal';
      }
    } else if (category === 'regionaal') {
      // If not relevant to Brabant, filter it out
      relevanceScore = 0;
    }

    // Check for important news
    const importantTerms = ['belangrijk', 'urgent', 'breaking', 'update'];
    if (importantTerms.some(term => contentText.includes(term))) {
      relevanceScore += 2;
      if (category === 'lokaal') {
        category = 'belangrijk';
      }
    }

    // Add time-based relevance
    const ageInHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageInHours < 24) {
      relevanceScore += Math.max(0, (24 - ageInHours) / 24 * 2);
    }

    // Add source-based relevance
    if (source.includes('brabant') || source.includes('bndestem') || source.includes('bd.nl')) {
      relevanceScore += 2; // Boost local/regional sources
    }

    return {
      ...article,
      relevanceScore,
      category
    };
  });

  // Filter and sort articles
  return processedArticles
    .filter(article => article.relevanceScore > 0)
    .sort((a, b) => {
      const categoryPriority = {
        'belangrijk': 3,
        'lokaal': 2,
        'regionaal': 1
      };
      const priorityDiff = categoryPriority[b.category] - categoryPriority[a.category];
      if (priorityDiff !== 0) return priorityDiff;
      
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
};

// Function to get cached articles
const getCachedArticles = (location: Location): NewsArticle[] | null => {
  try {
    const cacheKey = getCacheKey(location);
    console.log('Getting cached articles for key:', cacheKey);
    
    const cache = localStorage.getItem(cacheKey);
    if (!cache) {
      console.log('No cache found for key:', cacheKey);
      return null;
    }

    const cacheData: CacheEntry = JSON.parse(cache);
    console.log('Found cache data:', cacheData);
    
    if (!isCacheValid(cacheData)) {
      console.log('Cache expired, removing');
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log('Returning', cacheData.articles.length, 'cached articles');
    return cacheData.articles;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

// Function to set cached articles
const setCachedArticles = (location: Location, articles: NewsArticle[]) => {
  try {
    const cacheKey = getCacheKey(location);
    console.log('Setting cache for key:', cacheKey, 'with', articles.length, 'articles');
    
    const cacheData: CacheEntry = {
      timestamp: Date.now(),
      articles,
      location: location.city
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('Cache set successfully');
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

// Function to fetch all news (both local and national)
const fetchAllNews = async (location: Location): Promise<NewsArticle[]> => {
  try {
    console.log('Fetching all news for location:', location);
    
    // Try to get cached articles first
    const cachedArticles = getCachedArticles(location);
    if (cachedArticles) {
      console.log('Using cached articles for all news');
      return processArticles(cachedArticles, location);
    }

    // If no cache, fetch fresh articles
    console.log('No cache found, fetching fresh articles');
    const articles = await fetchRSSFeeds(location);
    
    // Process and cache the results
    if (articles.length > 0) {
      console.log('Processing and caching', articles.length, 'articles');
      const processedArticles = processArticles(articles, location);
      setCachedArticles(location, processedArticles);
      return processedArticles;
    } else {
      console.warn('No articles found to process or cache');
      return [];
    }
  } catch (error) {
    console.error('Error in fetchAllNews:', error);
    return [];
  }
};

// Main export function to get news
export const getNews = async (location: Location): Promise<NewsArticle[]> => {
  const articles = await fetchAllNews(location);
  return processArticles(articles, location);
}; 