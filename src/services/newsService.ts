import { XMLParser } from 'fast-xml-parser';
import { getRelativeTime } from '../utils/dateUtils';
import { Location, NewsArticle } from '../types/news';

// --- CONSTANTS ---

const CORS_PROXY = 'https://corsproxy.io/?';
const SOURCE_TYPES = {
  RSS: 'RSS Feed',
};

// --- HELPERS ---

const extractTextFromXml = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'object') {
    if (Array.isArray(node)) return node.map(extractTextFromXml).join(' ');
    if (node['#text']) return typeof node['#text'] === 'string' ? node['#text'] : extractTextFromXml(node['#text']);
    if (node['@_url']) return typeof node['@_url'] === 'string' ? node['@_url'] : extractTextFromXml(node['@_url']);
    return Object.values(node).map(value => extractTextFromXml(value)).filter(text => text).join(' ');
  }
  return String(node || '');
};

// Parses HTML from RSS description to find the first usable image.
const extractFirstImageFromHtml = (html: string): string | null => {
  if (!html) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const img = doc.querySelector("img");
    if (img && img.src && (!img.width || img.width > 50) && (!img.height || img.height > 50)) {
      if (img.src.startsWith('data:image/') && img.src.length < 200) return null;
      return img.src;
    }
    return null;
  } catch (error) {
    console.error("Error parsing HTML for image:", error);
    return null;
  }
};

const fetchImageFromUrl = async (url: string): Promise<string | null> => {
  if (!url) return null;
  console.log(`Attempting to fetch og:image from ${url}`);
  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}, status: ${response.status}`);
      return null;
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const ogImage = doc.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.getAttribute('content')) {
      console.log(`Found og:image: ${ogImage.getAttribute('content')}`);
      return ogImage.getAttribute('content');
    }
    
    const twitterImage = doc.querySelector('meta[name="twitter:image"]');
    if (twitterImage && twitterImage.getAttribute('content')) {
      console.log(`Found twitter:image: ${twitterImage.getAttribute('content')}`);
      return twitterImage.getAttribute('content');
    }

    console.log(`No og:image or twitter:image found for ${url}`);
    return null;
  } catch (error) {
    console.error(`Error fetching or parsing meta image from URL ${url}:`, error);
    return null;
  }
};

// --- NEWS SOURCES ---

const LOCAL_NEWS_SOURCES: { [key: string]: Array<{ name: string; rssUrl: string; baseUrl: string }> } = {
  'Noord-Brabant': [
    { name: 'Omroep Brabant', rssUrl: 'https://www.omroepbrabant.nl/rss', baseUrl: 'https://www.omroepbrabant.nl' },
    { name: 'BN DeStem Moerdijk', rssUrl: 'https://www.bndestem.nl/moerdijk/rss.xml', baseUrl: 'https://www.bndestem.nl' },
    { name: 'BN DeStem Regio', rssUrl: 'https://www.bndestem.nl/regio/rss.xml', baseUrl: 'https://www.bndestem.nl' },
    { name: 'Brabants Dagblad', rssUrl: 'https://www.bd.nl/moerdijk/rss.xml', baseUrl: 'https://www.bd.nl' },
    { name: 'Moerdijk Nieuws', rssUrl: 'https://moerdijk.nieuws.nl/feed/', baseUrl: 'https://moerdijk.nieuws.nl' },
    { name: 'Internet Bode', rssUrl: 'https://internetbode.nl/moerdijk/rss', baseUrl: 'https://internetbode.nl' }
  ],
  'Zuid-Holland': [
    { name: 'RTV Rijnmond', rssUrl: 'https://rijnmond.nl/rss', baseUrl: 'https://rijnmond.nl' },
    { name: 'AD Rotterdam', rssUrl: 'https://www.ad.nl/rotterdam/rss.xml', baseUrl: 'https://www.ad.nl' },
    { name: 'Omroep West', rssUrl: 'https://www.omroepwest.nl/nieuws/rss.xml', baseUrl: 'https://www.omroepwest.nl' }
  ],
  'Gelderland': [{ name: 'Omroep Gelderland', rssUrl: 'https://www.omroepgelderland.nl/nieuws/rss', baseUrl: 'https://www.omroepgelderland.nl' }],
  'Utrecht': [{ name: 'RTV Utrecht', rssUrl: 'https://rtvutrecht.nl/feed/rss.xml', baseUrl: 'https://rtvutrecht.nl' }],
  'Overijssel': [{ name: 'RTV Oost', rssUrl: 'https://www.rtvoost.nl/nieuws/rss', baseUrl: 'https://www.rtvoost.nl' }],
  'Friesland': [{ name: 'Omrop Fryslân', rssUrl: 'https://www.omropfryslan.nl/nieuws/rss.xml', baseUrl: 'https://www.omropfryslan.nl' }],
  'Groningen': [{ name: 'RTV Noord', rssUrl: 'https://www.rtvnoord.nl/nieuws/rss', baseUrl: 'https://www.rtvnoord.nl' }],
  'Drenthe': [{ name: 'RTV Drenthe', rssUrl: 'https://www.rtvdrenthe.nl/nieuws/rss', baseUrl: 'https://www.rtvdrenthe.nl' }],
  'Zeeland': [{ name: 'Omroep Zeeland', rssUrl: 'https://www.omroepzeeland.nl/nieuws/rss', baseUrl: 'https://www.omroepzeeland.nl' }],
  'Flevoland': [{ name: 'Omroep Flevoland', rssUrl: 'https://www.omroepflevoland.nl/nieuws/rss', baseUrl: 'https://www.omroepflevoland.nl' }],
  'Limburg': [
    { name: 'L1', rssUrl: 'https://l1.nl/feed/', baseUrl: 'https://l1.nl' },
    { name: 'De Limburger', rssUrl: 'https://www.limburger.nl/rss', baseUrl: 'https://www.limburger.nl' }
  ],
  'Noord-Holland': [{ name: 'NH Nieuws', rssUrl: 'https://www.nhnieuws.nl/feed/rss.xml', baseUrl: 'https://www.nhnieuws.nl' }],
  // 🇫🇷 Frankrijk
  'Frankrijk – Nationaal': [
    { name: 'France24 (ENG)', rssUrl: 'https://www.france24.com/en/rss', baseUrl: 'https://www.france24.com' },
    { name: 'Le Monde', rssUrl: 'https://www.lemonde.fr/rss/une.xml', baseUrl: 'https://www.lemonde.fr' }
  ],

  'Frankrijk – Île-de-France (Parijs)': [
    { name: 'Paris Star', rssUrl: 'https://www.parisstaronline.com/feed', baseUrl: 'https://www.parisstaronline.com' }
  ],

  'Frankrijk – Occitanie (Toulouse)': [
    { name: 'La Dépêche du Midi', rssUrl: 'https://www.ladepeche.fr/rss.xml', baseUrl: 'https://www.ladepeche.fr' }
  ],

  // 🇪🇸 Spanje
  'Spanje – Nationaal': [
    { name: 'El País', rssUrl: 'https://feeds.elpais.com/mrss-s/publico', baseUrl: 'https://elpais.com' },
    { name: 'El Diario', rssUrl: 'https://www.eldiario.es/rss/', baseUrl: 'https://eldiario.es' }
  ],

  'Spanje – Cataluña (Barcelona)': [
    { name: 'La Vanguardia', rssUrl: 'https://www.lavanguardia.com/mvc/feed/rss/home', baseUrl: 'https://lavanguardia.com' }
  ],

  'Spanje – Comunidad Valenciana (Valencia)': [
    { name: 'Las Provincias', rssUrl: 'https://www.lasprovincias.es/rss/feed.xml', baseUrl: 'https://lasprovincias.es' }
  ],

  // 🇨🇳 China
  'China – Nationaal (SCMP)': [
    { name: 'South China Morning Post – China', rssUrl: 'https://www.scmp.com/rss/asia/china', baseUrl: 'https://scmp.com' }
  ],

  // 🇺🇸 Verenigde Staten
  'VS – Nationaal': [
    { name: 'New York Times', rssUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', baseUrl: 'https://nytimes.com' }
  ],

  'VS – New York (New York City)': [
    { name: 'Gothamist', rssUrl: 'https://gothamist.com/feed', baseUrl: 'https://gothamist.com' }
  ],

  'VS – Californië (San Francisco)': [
    { name: 'SF Chronicle – Bay Area', rssUrl: 'https://www.sfchronicle.com/bayarea/?service=rss', baseUrl: 'https://sfchronicle.com' }
  ],

  // 🇮🇹 Italië
  'Italië – Nationaal': [
    { name: 'Corriere della Sera', rssUrl: 'https://rss.corriere.it/rss/homepage.xml', baseUrl: 'https://corriere.it' }
  ],

  'Italië – Lazio (Rome)': [
    { name: 'Roma Today', rssUrl: 'https://www.romatoday.it/rss.xml', baseUrl: 'https://romatoday.it' }
  ],

  'Italië – Lombardia (Milaan)': [
    { name: 'Milano Today', rssUrl: 'https://www.milanotoday.it/rss.xml', baseUrl: 'https://milanotoday.it' }
  ],

  // 🇹🇷 Turkije
  'Turkije – Nationaal': [
    { name: 'Hürriyet Daily News', rssUrl: 'https://www.hurriyetdailynews.com/rss', baseUrl: 'https://hurriyetdailynews.com' }
  ],

  'Turkije – Istanbul': [
    { name: 'Hürriyet Daily News – Istanbul', rssUrl: 'https://www.hurriyetdailynews.com/rss', baseUrl: 'https://hurriyetdailynews.com' }
  ],

  // 🇲🇽 Mexico
  'Mexico – Nationaal': [
    { name: 'El Universal', rssUrl: 'https://www.eluniversal.com.mx/rss.xml', baseUrl: 'https://eluniversal.com.mx' }
  ],

  'Mexico – Ciudad de México': [
    { name: 'Mexico News Daily', rssUrl: 'https://mexiconewsdaily.com/feed/', baseUrl: 'https://mexiconewsdaily.com' }
  ],

  'Mexico – Jalisco (Guadalajara)': [
    { name: 'El Informador', rssUrl: 'https://www.informador.mx/rss', baseUrl: 'https://informador.mx' }
  ],

  // 🇹🇭 Thailand
  'Thailand – Nationaal': [
    { name: 'Bangkok Post', rssUrl: 'https://www.bangkokpost.com/rss/data/boom.rss', baseUrl: 'https://bangkokpost.com' }
  ],

  'Thailand – Bangkok': [
    { name: 'Bangkok Post – Bangkok', rssUrl: 'https://www.bangkokpost.com/rss/data/boom.rss', baseUrl: 'https://bangkokpost.com' }
  ],

  // 🇩🇪 Duitsland
  'Duitsland – Nationaal': [
    { name: 'Der Spiegel', rssUrl: 'https://www.spiegel.de/international/index.rss', baseUrl: 'https://spiegel.de' },
    { name: 'Süddeutsche Zeitung', rssUrl: 'https://rss.sueddeutsche.de/rss/TopNews.xml', baseUrl: 'https://sueddeutsche.de' }
  ],

  'Duitsland – Bayern (München)': [
    { name: 'Süddeutsche Zeitung – München', rssUrl: 'https://rss.sueddeutsche.de/rss/TopNews.xml', baseUrl: 'https://sueddeutsche.de' }
  ],

  // 🇧🇪 België
  'België – Nationaal': [
    { name: 'Gazet van Antwerpen', rssUrl: 'https://www.gva.be/rss/home', baseUrl: 'https://gva.be' }
  ],

  'België – Vlaanderen (Antwerpen)': [
    { name: 'Gazet van Antwerpen – Antwerpen', rssUrl: 'https://www.gva.be/rss/home', baseUrl: 'https://gva.be' }
  ],

  'België – Wallonië (Luik)': [
    { name: 'La Meuse', rssUrl: 'https://www.lameuse.be/rss', baseUrl: 'https://lameuse.be' }
  ],

  // 🇬🇧 Verenigd Koninkrijk
  'VK – Nationaal': [
    { name: 'BBC News', rssUrl: 'http://feeds.bbci.co.uk/news/rss.xml', baseUrl: 'https://bbc.co.uk' },
    { name: 'The Guardian', rssUrl: 'https://www.theguardian.com/uk/rss', baseUrl: 'https://theguardian.com' }
  ],

  'VK – Greater London (Londen)': [
    { name: 'Evening Standard', rssUrl: 'https://www.standard.co.uk/news?view=rss', baseUrl: 'https://standard.co.uk' }
  ],

  'VK – Greater Manchester (Manchester)': [
    { name: 'Manchester Evening News', rssUrl: 'https://www.manchestereveningnews.co.uk/news/?service=rss', baseUrl: 'https://menmedia.co.uk' }
  ]
};

const DUTCH_NATIONAL_NEWS_SOURCES = [
  { name: 'NOS', rssUrl: 'https://feeds.nos.nl/nosnieuwsalgemeen', baseUrl: 'https://nos.nl' },
  { name: 'NU.nl', rssUrl: 'https://www.nu.nl/rss/algemeen', baseUrl: 'https://www.nu.nl' }
];

const NATIONAL_NEWS_SOURCES = [
  { name: 'NOS', rssUrl: 'https://feeds.nos.nl/nosnieuwsalgemeen', baseUrl: 'https://nos.nl' },
  { name: 'NU.nl', rssUrl: 'https://www.nu.nl/rss/algemeen', baseUrl: 'https://www.nu.nl' },
  { name: 'France24 (ENG)', rssUrl: 'https://www.france24.com/en/rss', baseUrl: 'https://france24.com' },
  { name: 'El País (Spanje)', rssUrl: 'https://feeds.elpais.com/mrss-s/publico', baseUrl: 'https://elpais.com' },
  { name: 'South China Morning Post (China)', rssUrl: 'https://www.scmp.com/rss/asia/china', baseUrl: 'https://scmp.com' },
  { name: 'New York Times (VS)', rssUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', baseUrl: 'https://nytimes.com' },
  { name: 'Corriere della Sera (Italië)', rssUrl: 'https://rss.corriere.it/rss/homepage.xml', baseUrl: 'https://corriere.it' },
  { name: 'Hürriyet Daily News (Turkije)', rssUrl: 'https://www.hurriyetdailynews.com/rss', baseUrl: 'https://hurriyetdailynews.com' },
  { name: 'El Universal (Mexico)', rssUrl: 'https://www.eluniversal.com.mx/rss.xml', baseUrl: 'https://eluniversal.com.mx' },
  { name: 'Bangkok Post (Thailand)', rssUrl: 'https://www.bangkokpost.com/rss/data/boom.rss', baseUrl: 'https://bangkokpost.com' },
  { name: 'Der Spiegel (Duitsland)', rssUrl: 'https://www.spiegel.de/international/index.rss', baseUrl: 'https://spiegel.de' },
  { name: 'BBC News (VK)', rssUrl: 'http://feeds.bbci.co.uk/news/rss.xml', baseUrl: 'https://bbc.co.uk' }
];

// --- PROCESSING LOGIC ---

// Creates a standardized NewsArticle object from an RSS item.
const processArticleFields = async (item: any, source: any, location: Location): Promise<NewsArticle | null> => {
  try {
    const publishedAt = new Date(item.pubDate || item.published || item.date).toISOString();
    const content = item.description || item['content:encoded'] || item.content?.['#text'] || item.content || item.summary || '';
    const cleanContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Efficiently find the thumbnail from data already present in the feed.
    let thumbnail: string | null = (Array.isArray(item.enclosure) ? item.enclosure[0]?.['@_url'] : item.enclosure?.['@_url']) || 
                    (Array.isArray(item['media:content']) ? item['media:content'][0]?.['@_url'] : item['media:content']?.['@_url']) || 
                    (Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0]?.['@_url'] : item['media:thumbnail']?.['@_url']) || 
                    '';
      if (!thumbnail) {
      thumbnail = extractFirstImageFromHtml(content);
    }
  
    const articleUrl = extractTextFromXml(item.link) || extractTextFromXml(item.guid);
        
    // If still no thumbnail, try fetching from the article page itself as a last resort
    if (!thumbnail && articleUrl) {
      thumbnail = await fetchImageFromUrl(articleUrl);
    }

      return {
      id: btoa(articleUrl), // URL-safe Base64 ID
      title: extractTextFromXml(item.title),
      content: extractTextFromXml(cleanContent),
      summary: extractTextFromXml(cleanContent).replace(/<[^>]+>/g, '').substring(0, 200),
      thumbnail: thumbnail || '',
        location: location.city,
        publishedAt,
      source: extractTextFromXml(source.name),
      author: extractTextFromXml(item.author) || extractTextFromXml(item.creator) || extractTextFromXml(source.name),
        category: 'lokaal',
        relevanceScore: 0,
      url: articleUrl,
      relativeTime: getRelativeTime(publishedAt),
      sourceType: SOURCE_TYPES.RSS,
      rawRssContent: content,
    };
  } catch (e) {
    console.error(`Error processing RSS item from ${source.name}:`, e, 'Item:', item);
    return null;
  }
};

// Filters and sorts the collected articles.
const processArticles = (articles: NewsArticle[], location: Location): NewsArticle[] => {
  const uniqueArticles = articles.reduce((acc: NewsArticle[], article) => {
    const isDuplicate = acc.some(existing => existing.url === article.url);
    if (!isDuplicate) acc.push(article);
    return acc;
  }, []);
  
  const dutchCityTerms = [
    'eindhoven', 'tilburg', 'breda', 'den bosch', 's-hertogenbosch', 'roosendaal', 'bergen op zoom', 'etten-leur', 'oosterhout', 'waalwijk', 'moerdijk', 'zevenbergen', 'klundert', 'willemstad', 'fijnaart', 'standdaarbuiten', 'noordhoek', 'oudenbosch', 'rotterdam', 'den haag', 'leiden', 'dordrecht', 'delft', 'gouda', 'zoetermeer', 'amsterdam', 'haarlem', 'alkmaar', 'zaanstad', 'hoorn', 'amstelveen', 'utrecht', 'amersfoort', 'nieuwegein', 'zeist', 'vianen', 'nijmegen', 'arnhem', 'apeldoorn', 'ede', 'zutphen', 'enschede', 'zwolle', 'deventer', 'hengelo', 'almelo', 'maastricht', 'heerlen', 'venlo', 'sittard', 'roermond', 'leeuwarden', 'drachten', 'sneek', 'heerenveen', 'groningen', 'delfzijl', 'assen', 'emmen', 'meppel', 'middelburg', 'vlissingen', 'goes', 'terneuzen', 'almere', 'lelystad', 'brabant'
  ];

  const determineArticleLocation = (text: string, userLocation: Location): string => {
    const lowerText = text.toLowerCase();
    
    // 1. Check for user's city first for highest relevance
    if (new RegExp(`\\b${userLocation.city.toLowerCase()}\\b`).test(lowerText)) return userLocation.city;
    
    // 2. Check for nearby cities
    const nearbyCity = (userLocation.nearbyCities || []).find(city => new RegExp(`\\b${city.toLowerCase()}\\b`).test(lowerText));
    if (nearbyCity) return nearbyCity;
    
    // 3. Check the broader list of Dutch cities
    const foundCity = dutchCityTerms.find(city => new RegExp(`\\b${city}\\b`).test(lowerText));
    if (foundCity) return foundCity.charAt(0).toUpperCase() + foundCity.slice(1);
    
    // 4. Default to user's city if no other location is found
    return userLocation.city;
  };

  const processedArticles = uniqueArticles.map(article => {
    let relevanceScore = 0;
    let category: 'belangrijk' | 'lokaal' | 'regionaal' = 'regionaal';
    const contentText = `${article.title} ${article.content}`;
    const source = article.source.toLowerCase();
    const articleDisplayLocation = determineArticleLocation(contentText, location);
    const lowerContentText = contentText.toLowerCase();
    const locationTerms = [location.city.toLowerCase(), ...(location.nearbyCities || []).map(city => city.toLowerCase())];
    const hasExactCityMatch = locationTerms.some(term => new RegExp(`\\b${term}\\b`, 'gi').test(lowerContentText));

    if (hasExactCityMatch) {
      relevanceScore += 10;
      category = 'lokaal';
    }
    const hasRegionalRelevance = dutchCityTerms.some(term => new RegExp(`\\b${term}\\b`, 'gi').test(lowerContentText)) || source.includes('brabant') || source.includes('bd.nl') || source.includes('bndestem');
    if (hasRegionalRelevance) {
      relevanceScore += 5;
      if (category !== 'lokaal') category = 'regionaal';
    }
    const importantTerms = ['belangrijk', 'urgent', 'breaking', 'update', 'waarschuwing', 'alert'];
    if (importantTerms.some(term => lowerContentText.includes(term)) && (hasExactCityMatch || hasRegionalRelevance)) {
      relevanceScore += 3;
      if (category === 'lokaal') category = 'belangrijk';
    }
    const ageInHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageInHours < 24) relevanceScore += Math.max(0, (24 - ageInHours) / 24 * 5);
    else relevanceScore *= 0.5;
    if (source.includes('brabant') || source.includes('bndestem') || source.includes('bd.nl')) relevanceScore += 3;
    return { ...article, location: articleDisplayLocation, relevanceScore, category };
  });

  return processedArticles
    .filter(article => article.relevanceScore > 1) // Less aggressive filtering
    .sort((a, b) => {
      const categoryPriority = { 'belangrijk': 3, 'lokaal': 2, 'regionaal': 1 };
      const priorityDiff = categoryPriority[b.category] - categoryPriority[a.category];
      if (priorityDiff !== 0) return priorityDiff;
      const dateComparison = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (dateComparison !== 0) return dateComparison;
        return b.relevanceScore - a.relevanceScore;
    });
};

// --- CORE FETCHING LOGIC ---

// Fetches all RSS feeds in parallel for maximum speed.
const fetchRSSFeeds = async (location: Location): Promise<NewsArticle[]> => {
  let sources = LOCAL_NEWS_SOURCES[location.region] || [];

  // Only add Dutch national news for locations in the Netherlands.
  if (location.country === 'Nederland') {
    sources = [...sources, ...DUTCH_NATIONAL_NEWS_SOURCES];
  }
  
  const parser = new XMLParser({
    ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text", removeNSPrefix: false,
    parseAttributeValue: true, parseTagValue: true, trimValues: true, allowBooleanAttributes: true,
    isArray: (name) => ['item', 'entry', 'media:content', 'media:thumbnail', 'enclosure'].includes(name),
  });

  const feedPromises = sources.map(async (source) => {
    try {
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(source.rssUrl)}`;
      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) }); // 10-second timeout
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const xmlText = await response.text();
      const result = parser.parse(xmlText);
      const items = result.rss?.channel?.item || result.feed?.entry || [];
      
      const articlePromises = items.map((item: any) => processArticleFields(item, source, location));
      
      const processedArticles = (await Promise.all(articlePromises))
        .filter((article): article is NewsArticle => article !== null);
        
      return processedArticles;
    } catch (error) {
      console.error(`Error fetching or parsing RSS feed ${source.name}:`, error);
      return [];
    }
  });

  const results = await Promise.all(feedPromises);
  return results.flat();
};

// --- MAIN EXPORT ---

// Location-aware cache to store articles per city/region.
const articlesCache: { [locationKey: string]: { articles: NewsArticle[], timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getNews = async (
  location: Location, 
  page = 1, 
  pageSize = 9
): Promise<{ articles: NewsArticle[], hasMore: boolean }> => {
  const now = Date.now();
  const locationKey = `${location.city}-${location.region}`;
  const cachedEntry = articlesCache[locationKey];

  let currentArticles: NewsArticle[] = [];

  // Use cache if it's recent and for the correct location, otherwise refetch
  if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION) {
    console.log(`Using cached articles for ${locationKey} (Page ${page}).`);
    currentArticles = cachedEntry.articles;
  } else {
    console.log(`Cache expired or empty for ${locationKey}. Fetching fresh articles.`);
    const rssArticles = await fetchRSSFeeds(location);
    console.log(`Found ${rssArticles.length} total articles from all feeds for ${locationKey}.`);
    
    if (rssArticles.length === 0) {
      console.warn("No articles were found from any RSS feed.");
      currentArticles = [];
    } else {
      currentArticles = processArticles(rssArticles, location);
    }
    
    // Store the newly fetched and processed articles in the location-specific cache
    articlesCache[locationKey] = {
      articles: currentArticles,
      timestamp: now,
    };
    console.log(`Processing complete. Total processed articles in cache for ${locationKey}: ${currentArticles.length}`);
  }

  // Paginate from the current articles (either from cache or freshly fetched)
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = currentArticles.slice(startIndex, endIndex);
  const hasMore = endIndex < currentArticles.length;
  
  console.log(`Returning page ${page} with ${paginatedArticles.length} articles for ${locationKey}. Has more: ${hasMore}`);

  return { articles: paginatedArticles, hasMore };
}; 
