import React, { useState } from 'react';
import { debugRssFeed } from '../services/newsService';

interface DebugResult {
  feedName: string;
  imageUrls: string[];
  error?: string;
}

const RssDebugger: React.FC = () => {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState(false);

  const testFeeds = async () => {
    setLoading(true);
    const feeds = [
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
      },
      {
        name: 'Google News Nederland',
        url: 'https://news.google.com/rss?hl=nl&gl=NL&ceid=NL:nl',
        baseUrl: 'https://news.google.com'
      },
      {
        name: 'NU.nl Algemeen',
        url: 'https://www.nu.nl/rss/algemeen',
        baseUrl: 'https://www.nu.nl'
      }
    ];

    const newResults: DebugResult[] = [];

    for (const feed of feeds) {
      try {
        const result = await debugRssFeed(feed.url, feed.name);
        if (result.success && result.items?.length > 0) {
          const imageUrls = result.items
            .slice(0, 5) // Test first 5 articles
            .map(item => {
              const content = item.description || 
                            item['content:encoded'] || 
                            item.content?.['#text'] ||
                            item.content ||
                            '';
              return {
                title: item.title,
                thumbnail: item.thumbnail || '/news-placeholder.svg',
                hasMediaContent: !!item['media:content'],
                hasMediaThumbnail: !!item['media:thumbnail'],
                hasEnclosure: !!item.enclosure,
                contentLength: content.length
              };
            });

          newResults.push({
            feedName: feed.name,
            imageUrls: imageUrls.map(i => i.thumbnail)
          });
        } else {
          newResults.push({
            feedName: feed.name,
            imageUrls: [],
            error: 'No items found in feed'
          });
        }
      } catch (error) {
        newResults.push({
          feedName: feed.name,
          imageUrls: [],
          error: error.message
        });
      }
    }

    setResults(newResults);
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">RSS Feed Debugger</h1>
      
      <button
        onClick={testFeeds}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test RSS Feeds'}
      </button>

      {results.length > 0 && (
        <div className="mt-8">
          {results.map((result, index) => (
            <div key={index} className="mb-8 p-4 border rounded">
              <h2 className="text-xl font-semibold mb-4">{result.feedName}</h2>
              
              {result.error ? (
                <div className="text-red-500">Error: {result.error}</div>
              ) : (
                <div>
                  <h3 className="font-medium mb-2">Found Images:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {result.imageUrls.map((url, imgIndex) => (
                      <div key={imgIndex} className="space-y-2">
                        <img
                          src={url}
                          alt={`Test image ${imgIndex + 1}`}
                          className="w-full h-48 object-cover rounded"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = '/news-placeholder.svg';
                            img.title = 'Failed to load image';
                          }}
                        />
                        <div className="text-sm break-all">{url}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RssDebugger; 