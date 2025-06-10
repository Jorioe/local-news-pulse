import React, { useState, useEffect } from 'react';
import { XMLParser } from 'fast-xml-parser';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface RssItem {
  title: string;
  link: string;
  description?: string;
  'content:encoded'?: string;
  pubDate: string;
  'media:content'?: {
    '@_url'?: string;
    '@_type'?: string;
  } | Array<{
    '@_url'?: string;
    '@_type'?: string;
  }>;
  'media:thumbnail'?: {
    '@_url'?: string;
  } | Array<{
    '@_url'?: string;
  }>;
  enclosure?: {
    '@_url'?: string;
    '@_type'?: string;
  } | Array<{
    '@_url'?: string;
    '@_type'?: string;
  }>;
}

interface ProcessedRssItem extends RssItem {
  imageUrl: string;
  cleanDescription: string;
  formattedDate: string;
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const RssReader: React.FC = () => {
  const [items, setItems] = useState<ProcessedRssItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeed, setSelectedFeed] = useState('https://www.nu.nl/rss/algemeen');
  const [selectedRegion, setSelectedRegion] = useState('landelijk');

  const feeds = {
    landelijk: [
      { name: 'NU.nl Algemeen', url: 'https://www.nu.nl/rss/algemeen' },
      { name: 'NOS Algemeen', url: 'https://feeds.nos.nl/nosnieuwsalgemeen' },
      { name: 'RTL Nieuws', url: 'https://www.rtlnieuws.nl/rss.xml' },
    ],
    brabant: [
      { name: 'Omroep Brabant', url: 'https://www.omroepbrabant.nl/rss' },
      { name: 'BN DeStem', url: 'https://www.bndestem.nl/rss.xml' },
      { name: 'Eindhovens Dagblad', url: 'https://www.ed.nl/feed' },
      { name: 'Brabants Dagblad', url: 'https://www.bd.nl/feed' },
      { name: 'Studio040 Eindhoven', url: 'https://studio040.nl/feed' },
      { name: 'InBrabant', url: 'https://inbrabant.nl/feed/' },
    ],
    limburg: [
      { name: 'L1 Limburg', url: 'https://l1.nl/feed/' },
      { name: 'De Limburger', url: 'https://www.limburger.nl/rss' },
      { name: '1Limburg', url: 'https://www.1limburg.nl/rss' },
    ],
    gelderland: [
      { name: 'Omroep Gelderland', url: 'https://www.omroepgelderland.nl/rss' },
      { name: 'De Gelderlander', url: 'https://www.gelderlander.nl/feed' },
      { name: 'RN7', url: 'https://www.rn7.nl/feed' },
    ],
    overijssel: [
      { name: 'RTV Oost', url: 'https://www.rtvoost.nl/rss' },
      { name: 'Tubantia', url: 'https://www.tubantia.nl/feed' },
      { name: 'De Stentor', url: 'https://www.destentor.nl/feed' },
    ],
    utrecht: [
      { name: 'RTV Utrecht', url: 'https://rtvutrecht.nl/rss' },
      { name: 'AD Utrecht', url: 'https://www.ad.nl/utrecht/rss.xml' },
      { name: 'DUIC', url: 'https://www.duic.nl/feed' },
    ],
    noordholland: [
      { name: 'NH Nieuws', url: 'https://www.nhnieuws.nl/feed/rss.xml' },
      { name: 'Het Parool', url: 'https://www.parool.nl/rss' },
      { name: 'Noordhollands Dagblad', url: 'https://www.noordhollandsdagblad.nl/feed' },
      { name: 'AT5', url: 'https://www.at5.nl/feed' },
    ],
    zuidholland: [
      { name: 'Rijnmond', url: 'https://rijnmond.nl/rss' },
      { name: 'AD Rotterdam', url: 'https://www.ad.nl/rotterdam/rss.xml' },
      { name: 'Omroep West', url: 'https://www.omroepwest.nl/rss' },
      { name: 'Den Haag FM', url: 'https://denhaagfm.nl/feed' },
    ],
    friesland: [
      { name: 'Omrop Fryslân', url: 'https://www.omropfryslan.nl/rss' },
      { name: 'Leeuwarder Courant', url: 'https://www.lc.nl/rss' },
      { name: 'Friesch Dagblad', url: 'https://frieschdagblad.nl/feed' },
    ],
    groningen: [
      { name: 'RTV Noord', url: 'https://www.rtvnoord.nl/rss' },
      { name: 'Dagblad van het Noorden', url: 'https://www.dvhn.nl/rss' },
      { name: 'Sikkom Groningen', url: 'https://www.sikkom.nl/feed' },
    ],
    drenthe: [
      { name: 'RTV Drenthe', url: 'https://www.rtvdrenthe.nl/rss' },
      { name: 'Dagblad van het Noorden Drenthe', url: 'https://www.dvhn.nl/drenthe/rss' },
    ],
    flevoland: [
      { name: 'Omroep Flevoland', url: 'https://www.omroepflevoland.nl/rss' },
      { name: 'De Stentor Flevoland', url: 'https://www.destentor.nl/flevoland/rss.xml' },
    ],
    zeeland: [
      { name: 'Omroep Zeeland', url: 'https://www.omroepzeeland.nl/rss' },
      { name: 'PZC', url: 'https://www.pzc.nl/feed' },
      { name: 'HVZeeland', url: 'https://www.hvzeeland.nl/feed' },
    ],
  };

  const regions = [
    { id: 'landelijk', name: 'Landelijk' },
    { id: 'brabant', name: 'Noord-Brabant' },
    { id: 'limburg', name: 'Limburg' },
    { id: 'gelderland', name: 'Gelderland' },
    { id: 'overijssel', name: 'Overijssel' },
    { id: 'utrecht', name: 'Utrecht' },
    { id: 'noordholland', name: 'Noord-Holland' },
    { id: 'zuidholland', name: 'Zuid-Holland' },
    { id: 'friesland', name: 'Friesland' },
    { id: 'groningen', name: 'Groningen' },
    { id: 'drenthe', name: 'Drenthe' },
    { id: 'flevoland', name: 'Flevoland' },
    { id: 'zeeland', name: 'Zeeland' },
  ];

  const extractImageUrl = (item: RssItem): string => {
    // 1. Check enclosure tags (NU.nl uses these)
    if (item.enclosure) {
      const enclosures = Array.isArray(item.enclosure) ? item.enclosure : [item.enclosure];
      const imageEnclosure = enclosures.find(e => e['@_type']?.startsWith('image/'));
      if (imageEnclosure?.['@_url']) {
        return imageEnclosure['@_url'];
      }
    }

    // 2. Check media:content tags
    if (item['media:content']) {
      const mediaContents = Array.isArray(item['media:content']) 
        ? item['media:content'] 
        : [item['media:content']];
      const imageContent = mediaContents.find(m => m['@_type']?.startsWith('image/'));
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
    const content = item['content:encoded'] || item.description || '';
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1]) {
      return imgMatch[1];
    }

    return '/news-placeholder.svg';
  };

  const cleanHtml = (html: string): string => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return format(date, 'dd MMMM yyyy HH:mm', { locale: nl });
    } catch {
      return dateStr;
    }
  };

  const fetchRssFeed = async (feedUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(feedUrl)}`);
      if (!response.ok) throw new Error('Netwerkfout bij het ophalen van de feed');
      
      const xmlText = await response.text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        removeNSPrefix: false,
        parseAttributeValue: true
      });
      
      const result = parser.parse(xmlText);
      const rawItems = result.rss?.channel?.item || [];

      const processedItems: ProcessedRssItem[] = rawItems.map((item: RssItem) => ({
        ...item,
        imageUrl: extractImageUrl(item),
        cleanDescription: cleanHtml(item.description || ''),
        formattedDate: formatDate(item.pubDate)
      }));

      setItems(processedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRssFeed(selectedFeed);
  }, [selectedFeed]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">RSS Reader</h1>
        
        {/* Region selector */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Kies een regio</h2>
          <div className="flex flex-wrap gap-2">
            {regions.map(region => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region.id)}
                className={`px-4 py-2 rounded ${
                  selectedRegion === region.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>
        </div>

        {/* Feed selector */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Kies een nieuwsbron</h2>
          <div className="flex flex-wrap gap-2">
            {feeds[selectedRegion as keyof typeof feeds].map(feed => (
              <button
                key={feed.url}
                onClick={() => setSelectedFeed(feed.url)}
                className={`px-4 py-2 rounded ${
                  selectedFeed === feed.url
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {feed.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <article
            key={item.link + index}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = '/news-placeholder.svg';
                }}
              />
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {item.title}
                </a>
              </h2>
              <p className="text-gray-600 text-sm mb-4">{item.formattedDate}</p>
              <p className="text-gray-700 line-clamp-3">{item.cleanDescription}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default RssReader; 