import { XMLParser } from 'fast-xml-parser';
import { getRelativeTime } from '../utils/dateUtils';
import { Location, NewsArticle } from '../types/news';

// API Keys should be stored in environment variables
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const SERP_API_KEY = import.meta.env.VITE_SERP_API_KEY;

// Helper function to safely extract text from XML nodes
const extractTextFromXml = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'object') {
    // Handle arrays
    if (Array.isArray(node)) {
      return node.map(extractTextFromXml).join(' ');
    }
    
    // Handle XML text nodes
    if (node['#text']) {
      return typeof node['#text'] === 'string' ? node['#text'] : extractTextFromXml(node['#text']);
    }
    
    // Handle URL attributes
    if (node['@_url']) {
      return typeof node['@_url'] === 'string' ? node['@_url'] : extractTextFromXml(node['@_url']);
    }
    
    // Handle nested objects by recursively extracting text from all values
    return Object.values(node)
      .map(value => extractTextFromXml(value))
      .filter(text => text)
      .join(' ');
  }
  return String(node || '');
};

// Source identifiers for tracking article origins
const SOURCE_TYPES = {
  RSS: 'RSS Feed',
  SERP: 'Google News (SerpAPI)',
  NEWS_API: 'NewsAPI',
  GOOGLE_RSS: 'Google News RSS'
} as const;

// Helper function to generate a stable article ID
const generateArticleId = (url: string, publishedAt: string): string => {
  if (!url) return '';
  try {
  // Use more characters from the hash for better uniqueness
  const hash = btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
  // Add source-specific prefix to prevent collisions
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace('www.', '');
  // Use the timestamp from publishedAt for stability
  const timestamp = new Date(publishedAt).getTime();
    // Create a stable hash instead of random suffix
  return `${domain}-${hash}-${timestamp}`;
  } catch (error) {
    console.error('Error generating article ID:', error);
    // Fallback to a simpler ID if URL parsing fails
    const hash = btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
    const timestamp = new Date(publishedAt).getTime();
    return `article-${hash}-${timestamp}`;
  }
};

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
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
    },
    {
      name: 'De Limburger',
      rssUrl: 'https://www.limburger.nl/rss',
      baseUrl: 'https://www.limburger.nl'
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

// Helper function to validate image URL
const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    // Handle data URLs
    if (url.startsWith('data:image/')) {
      return true;
    }

    // Handle base64 encoded images
    if (url.startsWith('data:') && url.includes(';base64,')) {
      return url.match(/^data:image\/(jpeg|jpg|png|gif|webp|avif);base64,/i) !== null;
    }

    // Clean up the URL first
    url = url.trim();
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }

    const urlObj = new URL(url);
    
    // Check if URL has an image extension
    const hasImageExt = /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(urlObj.pathname);
    
    // Check if URL path contains image-related keywords
    const hasImagePath = /(image|foto|afbeelding|media|upload|img|thumb|pics?|photos?)/i.test(urlObj.pathname);
    
    // Check if URL parameters indicate an image
    const params = urlObj.searchParams.toString().toLowerCase();
    const hasImageParam = params.includes('image') || 
                         params.includes('foto') || 
                         params.includes('media') ||
                         /[?&](type|format)=image/.test(params);
    
    // Check for common CDN and media domains
    const host = urlObj.hostname.toLowerCase();
    const isMediaDomain = host.includes('media') || 
                         host.includes('images') || 
                         host.includes('static') ||
                         host.includes('assets') ||
                         host.includes('cdn') ||
                         host.includes('img') ||
                         host.includes('storage');
    
    // Check for common image hosting domains
    const isImageHost = host.includes('cloudinary.com') ||
                       host.includes('imgix.net') ||
                       host.includes('imgur.com') ||
                       host.includes('res.cloudinary.com') ||
                       host.includes('images.ctfassets.net') ||
                       host.includes('img.youtube.com') ||
                       host.includes('images.nu.nl') ||
                       host.includes('media.nu.nl') ||
                       host.includes('images.ad.nl') ||
                       host.includes('media.ad.nl') ||
                       host.includes('images.nos.nl') ||
                       host.includes('media.nos.nl') ||
                       host.includes('images.omroepbrabant.nl') ||
                       host.includes('media.omroepbrabant.nl') ||
                       host.includes('images.bndestem.nl') ||
                       host.includes('media.bndestem.nl');
    
    // Exclude common non-image extensions
    const hasNonImageExt = /\.(pdf|doc|docx|txt|html|htm|php|asp|aspx|jsp|json|xml)$/i.test(urlObj.pathname);
    if (hasNonImageExt) {
      console.log('Rejected URL due to non-image extension:', url);
      return false;
    }
    
    // Check for specific image-related URL patterns
    const hasImagePattern = url.includes('/image/') ||
                          url.includes('/images/') ||
                          url.includes('/media/') ||
                          url.includes('/thumb/') ||
                          url.includes('/thumbnail/') ||
                          url.includes('/foto/') ||
                          url.includes('/fotos/') ||
                          url.includes('/afbeelding/') ||
                          url.includes('/afbeeldingen/');
    
    // Log the validation results
    const isValid = hasImageExt || 
                   (hasImagePath && !hasNonImageExt) || 
                   hasImageParam || 
                   isMediaDomain || 
                   isImageHost ||
                   hasImagePattern;
    
    console.log('Image URL validation:', {
      url,
      hasImageExt,
      hasImagePath,
      hasImageParam,
      isMediaDomain,
      isImageHost,
      hasImagePattern,
      isValid
    });
    
    return isValid;
  } catch (error) {
    // If URL parsing fails, try to check if it's a relative URL with an image extension
    try {
      return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(url);
    } catch {
      console.error('Error validating image URL:', { url, error });
      return false;
    }
  }
};

// Helper function to extract image URL from HTML content
const extractImageFromHtml = (html: string): string | null => {
  if (!html) return null;
  
  try {
    // Clean up HTML string
    const cleanHtml = html.replace(/\\["']/g, '');
    
    // Array to store potential image URLs with their priority
    const images: Array<{ url: string; priority: number }> = [];
    
    // 1. Try to find og:image meta tags (highest priority)
    const ogImageMatches = cleanHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/ig);
    if (ogImageMatches) {
      ogImageMatches.forEach(match => {
        const url = match.match(/content=["']([^"']+)["']/i)?.[1];
        if (url) images.push({ url, priority: 100 });
      });
    }

    // 2. Try to find Twitter image meta tags
    const twitterImageMatches = cleanHtml.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/ig);
    if (twitterImageMatches) {
      twitterImageMatches.forEach(match => {
        const url = match.match(/content=["']([^"']+)["']/i)?.[1];
        if (url) images.push({ url, priority: 90 });
      });
    }

    // 3. Try to find figure tags with images
    const figureMatches = cleanHtml.match(/<figure[^>]*>.*?<img[^>]+src=["']([^"']+)["'][^>]*>.*?<\/figure>/ig);
    if (figureMatches) {
      figureMatches.forEach(match => {
        const url = match.match(/src=["']([^"']+)["']/i)?.[1];
        if (url) {
          // Check if it has a width/height attribute
          const hasSize = /width=["'](\d+)["'].*?height=["'](\d+)["']/i.test(match);
          images.push({ url, priority: hasSize ? 80 : 70 });
        }
      });
    }

    // 4. Try to find regular img tags
    const imgMatches = Array.from(cleanHtml.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/ig));
    for (const match of imgMatches) {
      const imgTag = match[0];
      const url = match[1];
      
      if (url) {
        let priority = 60;
        
        // Check for size attributes
        const widthMatch = imgTag.match(/width=["'](\d+)["']/i);
        const heightMatch = imgTag.match(/height=["'](\d+)["']/i);
        
        if (widthMatch && heightMatch) {
          const width = parseInt(widthMatch[1]);
          const height = parseInt(heightMatch[1]);
          
          // Increase priority for larger images
          if (width >= 400 && height >= 300) priority = 75;
          else if (width >= 200 && height >= 150) priority = 70;
          // Decrease priority for very small images (likely icons)
          else if (width <= 50 || height <= 50) priority = 30;
        }
        
        // Check for keywords in URL or alt text that might indicate importance
        const altMatch = imgTag.match(/alt=["']([^"']+)["']/i);
        if (altMatch) {
          const alt = altMatch[1].toLowerCase();
          if (/(header|banner|featured|hero|main)/i.test(alt)) {
            priority += 10;
          }
        }
        
        if (/(header|banner|featured|hero|main)/i.test(url)) {
          priority += 10;
        }
        
        images.push({ url, priority });
      }
    }

    // 5. Try to find background-image in style attributes
    const styleMatches = cleanHtml.match(/style=["'][^"']*background-image:\s*url\(['"]([^'"]+)['"]\)[^"']*/ig);
    if (styleMatches) {
      styleMatches.forEach(match => {
        const url = match.match(/url\(['"]([^'"]+)['"]\)/i)?.[1];
        if (url) images.push({ url, priority: 50 });
      });
    }

    // Sort images by priority and filter out invalid URLs
    const sortedImages = images
      .sort((a, b) => b.priority - a.priority)
      .filter(img => isValidImageUrl(img.url));

    // Return the highest priority valid image URL
    return sortedImages.length > 0 ? sortedImages[0].url : null;
  } catch (error) {
    console.error('Error extracting image from HTML:', error);
    return null;
  }
};

// Helper function to make URL absolute
const makeUrlAbsolute = (url: string, baseUrl: string): string => {
  if (!url || !baseUrl) return url || '';
  
  try {
  // Clean up the URL
    let cleanUrl = url.trim();
    
    // Handle data URLs and already absolute URLs
    if (cleanUrl.startsWith('data:') || cleanUrl.match(/^https?:\/\//i)) {
      return cleanUrl;
    }

    // Handle protocol-relative URLs
    if (cleanUrl.startsWith('//')) {
      return 'https:' + cleanUrl;
    }

    // Clean up the base URL
    let cleanBaseUrl = baseUrl.trim();
    if (!cleanBaseUrl.match(/^https?:\/\//i)) {
      cleanBaseUrl = 'https://' + cleanBaseUrl;
    }

    // Remove trailing slash from base URL if present
    cleanBaseUrl = cleanBaseUrl.replace(/\/$/, '');

    // Handle root-relative URLs
    if (cleanUrl.startsWith('/')) {
      // Get the base domain
      const baseUrlObj = new URL(cleanBaseUrl);
      return `${baseUrlObj.protocol}//${baseUrlObj.host}${cleanUrl}`;
    }

    // Handle relative URLs
    if (!cleanUrl.includes('://')) {
      // If the base URL doesn't end with a slash and the clean URL doesn't start with one,
      // we need to add one
      if (!cleanBaseUrl.endsWith('/') && !cleanUrl.startsWith('/')) {
        cleanBaseUrl += '/';
      }
      return cleanBaseUrl + cleanUrl;
    }

    return cleanUrl;
  } catch (error) {
    console.error('Error making URL absolute:', { url, baseUrl, error });
    return url;
  }
};

// Types for RSS feed items
interface RssMediaContent {
  '@_url'?: string;
  '@_type'?: string;
  '@_medium'?: string;
  '@_width'?: string;
  '@_height'?: string;
}

interface RssEnclosure {
  '@_url'?: string;
  '@_type'?: string;
  '@_length'?: string;
}

interface RssImage {
  url?: string;
  title?: string;
  link?: string;
}

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  'content:encoded'?: string;
  pubDate?: string;
  'media:content'?: RssMediaContent | RssMediaContent[];
  'media:thumbnail'?: RssMediaContent | RssMediaContent[];
  enclosure?: RssEnclosure | RssEnclosure[];
  image?: RssImage | string;
  guid?: string;
  author?: string;
  creator?: string;
  content?: { '#text'?: string } | string;
  summary?: string;
}

// Enhanced function to extract thumbnail from RSS item
const extractThumbnail = (item: RssItem, content: string, baseUrl: string = ''): string => {
  try {
    // 1. Check enclosure tags (NU.nl uses these)
    if (item.enclosure) {
      const enclosures = Array.isArray(item.enclosure) ? item.enclosure : [item.enclosure];
      const imageEnclosure = enclosures.find(e => e['@_type']?.startsWith('image/'));
      if (imageEnclosure?.['@_url']) {
        // Use URL directly without validation for enclosures
        return imageEnclosure['@_url'];
      }
    }

    // 2. Check media:content tags
    if (item['media:content']) {
      const mediaContents = Array.isArray(item['media:content']) 
        ? item['media:content'] 
        : [item['media:content']];
      const imageContent = mediaContents.find(m => 
        m['@_type']?.startsWith('image/') || 
        m['@_medium'] === 'image' ||
        m['@_url']?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
      if (imageContent?.['@_url']) {
        return imageContent['@_url'];
      }
    }

    // 3. Check media:thumbnail tags
    if (item['media:thumbnail']) {
      const thumbnails = Array.isArray(item['media:thumbnail']) 
        ? item['media:thumbnail'] 
        : [item['media:thumbnail']];
      if (thumbnails[0]?.['@_url']) {
        return thumbnails[0]['@_url'];
      }
    }

    // 4. Try to extract from description or content:encoded
    const contentToSearch = item['content:encoded'] || item.description || content || '';
    const imgMatch = contentToSearch.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1]) {
      return imgMatch[1];
    }

    // 5. Check regular content field
    if (item.content) {
      const contentText = typeof item.content === 'string' 
        ? item.content 
        : item.content['#text'] 
        ? item.content['#text']
        : extractTextFromXml(item.content);
      
      const contentImgMatch = contentText.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (contentImgMatch?.[1]) {
        return contentImgMatch[1];
      }
    }

    // 6. Check image tag
    if (item.image) {
      const imageUrl = typeof item.image === 'object' ? item.image.url : item.image;
      if (imageUrl) {
        return imageUrl;
      }
    }

    // Fallback to news-specific placeholder
    return '/news-placeholder.svg';
  } catch (error) {
    console.error('Error extracting thumbnail:', error);
    return '/news-placeholder.svg';
  }
};

// Helper function to process article fields
const processArticleFields = (item: any, source: any, location: Location, publishedAt: string, relativeTime: string, cleanContent: string, thumbnail: string): NewsArticle => {
  return {
    id: generateArticleId(
      extractTextFromXml(item.link) || extractTextFromXml(item.guid), 
      publishedAt
    ),
    title: extractTextFromXml(item.title),
    content: extractTextFromXml(cleanContent),
    summary: extractTextFromXml(cleanContent).replace(/<[^>]+>/g, '').substring(0, 200),
    thumbnail,
    location: location.city,
    publishedAt,
    source: extractTextFromXml(source.name),
    author: extractTextFromXml(item.author) || extractTextFromXml(item.creator) || extractTextFromXml(source.name),
    category: 'lokaal',
    relevanceScore: 0,
    url: extractTextFromXml(item.link) || extractTextFromXml(item.guid) || '',
    relativeTime,
    sourceType: SOURCE_TYPES.RSS,
  };
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
      textNodeName: "#text",
      removeNSPrefix: false,
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
      allowBooleanAttributes: true,
      isArray: (name) => {
        // Always treat these tags as arrays even when there's only one
        return ['item', 'entry', 'media:content', 'media:thumbnail', 'enclosure'].includes(name);
      },
      tagValueProcessor: (tagName, tagValue) => {
        // Handle CDATA sections and HTML content
        if (typeof tagValue === 'string') {
          return tagValue.trim();
        }
        return tagValue;
      },
      attributeValueProcessor: (attrName, attrValue) => {
        // Handle attribute values
        if (typeof attrValue === 'string') {
          return attrValue.trim();
        }
        return attrValue;
      }
    });

    for (const source of sources) {
      try {
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(source.rssUrl)}`;
        console.log(`Fetching RSS feed from ${source.name} through proxy: ${proxyUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`Failed to fetch RSS feed from ${source.name}: ${response.status} ${response.statusText}`);
          continue;
        }

        const xmlText = await response.text();
        
        if (!xmlText.trim()) {
          console.error(`Empty response from ${source.name}`);
          continue;
        }

        // Log the raw XML for debugging
        console.log(`Raw XML from ${source.name} (first 500 chars):`, xmlText.substring(0, 500));

        try {
          const result = parser.parse(xmlText);
          
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

          // Log the first item for debugging
          if (items.length > 0) {
            console.log(`Sample item from ${source.name}:`, JSON.stringify(items[0], null, 2));
          }

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

              // Log content for debugging
              console.log(`Content from ${source.name}:`, {
                hasDescription: !!item.description,
                hasContentEncoded: !!item['content:encoded'],
                hasContent: !!item.content,
                contentLength: cleanContent.length,
                firstChars: cleanContent.substring(0, 100)
              });

              // Log media-related fields
              console.log(`Media fields for item from ${source.name}:`, {
                hasMediaContent: !!item['media:content'],
                hasMediaThumbnail: !!item['media:thumbnail'],
                hasEnclosure: !!item.enclosure,
                hasImage: !!item.image
              });

              // Extract thumbnail with detailed logging
              const thumbnail = extractThumbnail(item, cleanContent, source.baseUrl);
              console.log(`Extracted thumbnail for item from ${source.name}:`, {
                thumbnail,
                isPlaceholder: thumbnail === '/news-placeholder.svg'
              });

              const article = processArticleFields(item, source, location, publishedAt, relativeTime, cleanContent, thumbnail);

              if (article.title && article.content && article.url) {
                console.log(`Adding article from ${source.name}:`, {
                  title: article.title,
                  hasContent: !!article.content,
                  hasUrl: !!article.url,
                  thumbnail: article.thumbnail
                });
                articles.push(article);
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
        relativeTime,
        sourceType: SOURCE_TYPES.NEWS_API,
      };
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
};

// Function to fetch news from SerpAPI
const fetchSerpNews = async (location: Location): Promise<NewsArticle[]> => {
  try {
    console.log('🔍 Starting SerpAPI fetch for location:', location);
    
    // Check API key
    if (!SERP_API_KEY) {
      console.error('❌ SERP_API_KEY is missing in environment variables!');
      return [];
    }
    console.log('✅ SERP_API_KEY is present:', SERP_API_KEY.substring(0, 4) + '...');

    // Simple search query for city news - no exclusions
    const query = `${location.city} nieuws`;
    console.log('🔍 SerpAPI search query:', query);

    // Build the API URL with all required parameters
    const params = new URLSearchParams({
      engine: 'google',
      q: query,
      tbm: 'nws', // This tells Google to search in News
      location: 'Netherlands',
      google_domain: 'google.nl',
      gl: 'nl',
      hl: 'nl',
      api_key: SERP_API_KEY
    });

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    console.log('🔍 SerpAPI URL (without API key):', url.replace(SERP_API_KEY, 'HIDDEN'));

    try {
      const response = await fetch(url);
      console.log('🔍 SerpAPI response status:', response.status);

      // Log response headers
      const headers = Object.fromEntries(response.headers.entries());
      console.log('🔍 SerpAPI response headers:', headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SerpAPI request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return [];
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.error('❌ SerpAPI response is not JSON:', contentType);
        const text = await response.text();
        console.error('❌ Response text:', text);
        return [];
      }

      const data = await response.json();
      console.log('🔍 SerpAPI raw response:', JSON.stringify(data, null, 2));

      // Check for API errors
      if (data.error) {
        console.error('❌ SerpAPI returned an error:', data.error);
        return [];
      }

      // Get news results from the correct path in the response
      const newsResults = data.news_results || [];
      console.log('✅ SerpAPI found news results:', newsResults.length);

      // Convert SerpAPI results to our article format
      const articles = newsResults.map((result: any) => {
        const publishedAt = new Date(result.date || Date.now()).toISOString();
        return {
          id: generateArticleId(result.link, publishedAt),
          title: result.title,
          content: result.snippet,
          summary: result.snippet,
          thumbnail: result.thumbnail || '/placeholder-news.jpg',
          location: location.city,
          publishedAt,
          source: result.source,
          sourceType: SOURCE_TYPES.SERP,
          author: result.source,
          category: 'lokaal',
          relevanceScore: 0,
          url: result.link,
          relativeTime: formatRelativeTime(publishedAt)
        };
      });

      console.log('✅ Total SerpAPI articles converted:', articles.length);
      return articles;

    } catch (fetchError) {
      console.error('❌ Network error with SerpAPI:', fetchError);
      return [];
    }

  } catch (error) {
    console.error('❌ Error in fetchSerpNews:', error);
    return [];
  }
};

// Function to fetch news from Google News RSS
const fetchGoogleNewsRSS = async (location: Location): Promise<NewsArticle[]> => {
  try {
    console.log('📰 Starting Google News RSS fetch for location:', location);
    
    // Build the RSS URL
    const query = encodeURIComponent(`${location.city} OR ${location.region}`);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=nl&gl=NL&ceid=NL:nl`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(rssUrl)}`;
    
    console.log('📰 Fetching Google News RSS from:', proxyUrl);

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      console.error('❌ Google News RSS fetch failed:', response.statusText);
      return [];
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
      allowBooleanAttributes: true
    });

    const result = parser.parse(xmlText);
    const items = result.rss?.channel?.item || [];
    console.log('📰 Found Google News RSS items:', items.length);

    return items.map((item: any) => {
      const publishedAt = new Date(item.pubDate).toISOString();
      const cleanContent = extractTextFromXml(item.description);
      const thumbnail = extractThumbnail(item, cleanContent);
      const relativeTime = formatRelativeTime(publishedAt);
      const source = { name: SOURCE_TYPES.GOOGLE_RSS };
      
      return processArticleFields(
        { 
          ...item,
          creator: item.source,
          guid: item.link
        }, 
        source, 
        location, 
        publishedAt,
        relativeTime, 
        cleanContent, 
        thumbnail
      );
    });

  } catch (error) {
    console.error('❌ Error fetching Google News RSS:', error);
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
  relevanceScore?: number;
  category?: NewsCategory;
  sourceType?: string;
}

export interface ProcessedNewsArticle extends BaseNewsArticle {
  relevanceScore: number;
  category: NewsCategory;
}

// Helper function to ensure location is a string
const formatLocation = (location: string | Location | null | undefined): string => {
  if (!location) return 'Unknown Location';
  if (typeof location === 'string') return location;
  return location.city || 'Unknown Location';
};

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

    // Ensure location is a string
    const formattedLocation = formatLocation(article.location);

    return {
      ...article,
      location: formattedLocation,
      relevanceScore,
      category
    };
  });

  // Filter and sort articles
  return processedArticles
    .filter(article => article.relevanceScore > 0)
    .sort((a, b) => {
      // First sort by publication date (most recent first)
      const dateComparison = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // If articles are from the same time, use category as secondary sort
      const categoryPriority = {
        'belangrijk': 3,
        'lokaal': 2,
        'regionaal': 1
      };
      const priorityDiff = categoryPriority[b.category] - categoryPriority[a.category];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If category is the same, use relevance score as final tiebreaker
      return b.relevanceScore - a.relevanceScore;
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

// Update fetchAllNews to include Google News RSS
const fetchAllNews = async (location: Location): Promise<NewsArticle[]> => {
  try {
    console.log('📡 Starting fetchAllNews for location:', location);

    // Fetch articles from all sources in parallel
    const [rssArticles, newsApiArticles, serpArticles, googleNewsArticles] = await Promise.all([
      fetchRSSFeeds(location),
      fetchNews(location),
      fetchSerpNews(location),
      fetchGoogleNewsRSS(location)
    ]);

    console.log('📊 Articles fetched per source:', {
      rss: rssArticles.length,
      newsApi: newsApiArticles.length,
      serp: serpArticles.length,
      googleNews: googleNewsArticles.length
    });

    // Combine all articles
    const allArticles = [...rssArticles, ...newsApiArticles, ...serpArticles, ...googleNewsArticles];
    console.log('📊 Total articles before deduplication:', allArticles.length);

    // Remove duplicates based on URL and title similarity
    const uniqueArticles = allArticles.reduce((acc: NewsArticle[], article) => {
      // Check if we already have a similar article
      const isDuplicate = acc.some(existing => 
        // Same URL
        existing.url === article.url ||
        // Very similar titles (allowing for small differences)
        (existing.title.toLowerCase().includes(article.title.toLowerCase()) ||
         article.title.toLowerCase().includes(existing.title.toLowerCase()))
      );

      if (!isDuplicate) {
        acc.push(article);
      } else {
        console.log('🔄 Duplicate article found:', {
          title: article.title,
          source: article.sourceType
        });
      }
      return acc;
    }, []);

    console.log('📊 Total articles after deduplication:', uniqueArticles.length);

    // Process articles (calculate relevance scores, etc.)
    const processedArticles = processArticles(uniqueArticles, location);
    console.log('📊 Final processed articles:', processedArticles.length);

    return processedArticles;
  } catch (error) {
    console.error('❌ Error in fetchAllNews:', error);
    return [];
  }
};

// Main export function to get news
export const getNews = async (location: Location): Promise<NewsArticle[]> => {
  const articles = await fetchAllNews(location);
  return processArticles(articles, location);
};

// Debug function to test RSS feed fetching
export const debugRssFeed = async (feedUrl: string, sourceName: string) => {
  try {
    console.log(`\n🔍 Testing RSS feed for ${sourceName}`);
    console.log(`URL: ${feedUrl}`);

    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(feedUrl)}`;
    console.log('Fetching through proxy:', proxyUrl);

    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('\n📄 Raw XML sample (first 1000 chars):', xmlText.substring(0, 1000));

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      removeNSPrefix: false,
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
      allowBooleanAttributes: true,
      isArray: (name) => {
        return ['item', 'entry', 'media:content', 'media:thumbnail', 'enclosure'].includes(name);
      }
    });

    const result = parser.parse(xmlText);
    console.log('\n📊 Parsed RSS structure:', JSON.stringify(result, null, 2).substring(0, 1000));

    const items = result.rss?.channel?.item || result.feed?.entry || [];

    if (items.length === 0) {
      console.log('❌ No items found in feed');
      console.log('Feed structure:', JSON.stringify(result, null, 2));
      return;
    }

    console.log(`\n✅ Found ${items.length} items`);
    
    // Analyze first item in detail
    const firstItem = items[0];
    console.log('\n📝 First item complete structure:', JSON.stringify(firstItem, null, 2));
    console.log('\n🔎 Image sources analysis:');
    console.log('Title:', firstItem.title);
    console.log('Link:', firstItem.link);
    console.log('Has description:', !!firstItem.description);
    if (firstItem.description) {
      console.log('Description preview:', firstItem.description.substring(0, 200));
    }
    console.log('Has content:encoded:', !!firstItem['content:encoded']);
    if (firstItem['content:encoded']) {
      console.log('content:encoded preview:', firstItem['content:encoded'].substring(0, 200));
    }
    console.log('Has media:content:', !!firstItem['media:content']);
    if (firstItem['media:content']) {
      console.log('media:content:', firstItem['media:content']);
    }
    console.log('Has media:thumbnail:', !!firstItem['media:thumbnail']);
    if (firstItem['media:thumbnail']) {
      console.log('media:thumbnail:', firstItem['media:thumbnail']);
    }
    console.log('Has enclosure:', !!firstItem.enclosure);
    if (firstItem.enclosure) {
      console.log('enclosure:', firstItem.enclosure);
    }
    
    // Check for images in description
    if (firstItem.description) {
      const imgMatches = firstItem.description.match(/<img[^>]+src=["']([^"']+)["']/g);
      console.log('\n🖼️ Images in description:', imgMatches);
      if (imgMatches) {
        imgMatches.forEach((match, idx) => {
          const src = match.match(/src=["']([^"']+)["']/)?.[1];
          console.log(`Image ${idx + 1} src:`, src);
        });
      }
    }

    // Test image extraction
    const content = firstItem.description || 
                   firstItem['content:encoded'] || 
                   firstItem.content?.['#text'] ||
                   firstItem.content ||
                   '';
    
    const thumbnail = extractThumbnail(firstItem, content, feedUrl);
    console.log('\n🎯 Final extracted thumbnail:', thumbnail);
    console.log('Is placeholder?', thumbnail === '/news-placeholder.svg');

    return { success: true, items };
  } catch (error) {
    console.error('❌ Error testing RSS feed:', error);
    return { success: false, error };
  }
};

// Add debug function to test a specific feed
const testSpecificFeed = async () => {
  // Test a few different feeds
  const feedsToTest = [
    {
      name: 'Omroep Brabant',
      url: 'https://www.omroepbrabant.nl/rss',
      baseUrl: 'https://www.omroepbrabant.nl'
    },
    {
      name: 'BN DeStem',
      url: 'https://www.bndestem.nl/regio/rss.xml',
      baseUrl: 'https://www.bndestem.nl'
    },
    {
      name: 'NOS',
      url: 'https://feeds.nos.nl/nosnieuwsalgemeen',
      baseUrl: 'https://nos.nl'
    }
  ];

  for (const feed of feedsToTest) {
    console.log(`\n📰 Testing feed: ${feed.name}`);
    await debugRssFeed(feed.url, feed.name);
  }
}; 