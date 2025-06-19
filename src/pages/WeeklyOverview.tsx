import React from 'react';
import { Calendar } from 'lucide-react';
import { NewsArticle } from '../types/news';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomTabBar from '../components/BottomTabBar';

interface WeeklySummaryCard {
  id: string;
  weekNumber: number;
  year: number;
  articles: NewsArticle[];
}

interface WeeklyOverviewProps {
  isEmbedded?: boolean;
}

const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({ isEmbedded = false }) => {
  const { t } = useTranslation();

  // Mock data for weekly summaries
  const weeklySummaries: WeeklySummaryCard[] = [
    {
      id: 'week-52-2023',
      weekNumber: 52,
      year: 2023,
      articles: [
        {
          id: '1',
          title: 'Lokaal restaurant wint prestigieuze prijs',
          summary: 'Het restaurant De Gouden Lepel heeft de nationale horecaprijs gewonnen.',
          content: 'Uitgebreid artikel over de prijsuitreiking...',
          category: 'lokaal',
          publishedAt: '2023-12-28T12:00:00Z',
          source: 'Lokale Krant',
          location: 'Amsterdam',
          thumbnail: '/news-placeholder.svg',
          isFavorite: false,
          author: 'Jan Jansen',
          relevanceScore: 0.95,
          url: 'https://example.com/article/1',
          sourceType: 'local'
        },
        {
          id: '2',
          title: 'Nieuw cultuurcentrum opent deuren',
          summary: 'Modern cultuurcentrum verwelkomt eerste bezoekers in het centrum.',
          content: 'Details over de opening...',
          category: 'lokaal',
          publishedAt: '2023-12-27T15:30:00Z',
          source: 'Stadskrant',
          location: 'Amsterdam',
          thumbnail: '/news-placeholder.svg',
          isFavorite: false,
          author: 'Piet Peters',
          relevanceScore: 0.85,
          url: 'https://example.com/article/2',
          sourceType: 'local'
        }
      ]
    },
    {
      id: 'week-51-2023',
      weekNumber: 51,
      year: 2023,
      articles: [
        {
          id: '3',
          title: 'Lokaal sportteam bereikt finale',
          summary: 'Het lokale basketbalteam heeft de finale bereikt van de nationale competitie.',
          content: 'Verslag van de halve finale wedstrijd...',
          category: 'lokaal',
          publishedAt: '2023-12-21T14:00:00Z',
          source: 'Sport Nieuws',
          location: 'Amsterdam',
          thumbnail: '/news-placeholder.svg',
          isFavorite: false,
          author: 'Sarah Smits',
          relevanceScore: 0.88,
          url: 'https://example.com/article/3',
          sourceType: 'local'
        }
      ]
    },
    {
      id: 'week-50-2023',
      weekNumber: 50,
      year: 2023,
      articles: [
        {
          id: '4',
          title: 'Nieuwe fietsroute door de stad geopend',
          summary: 'Een nieuwe fietsroute verbindt verschillende wijken met het centrum.',
          content: 'Details over de nieuwe fietsroute...',
          category: 'lokaal',
          publishedAt: '2023-12-14T10:00:00Z',
          source: 'Stadsnieuws',
          location: 'Amsterdam',
          thumbnail: '/news-placeholder.svg',
          isFavorite: false,
          author: 'Lisa Laan',
          relevanceScore: 0.92,
          url: 'https://example.com/article/4',
          sourceType: 'local'
        }
      ]
    }
  ];

  const content = (
    <>
      {/* Header */}
      <div className="text-white px-4 sm:px-6 pt-12 pb-8" style={{ background: '#ff5f2e' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-center">{t('weekly_overview')}</h1>
          <p className="text-orange-100 text-base sm:text-lg text-center">{t('weekly_overview_description')}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 -mt-4">
        <div className="grid gap-6">
          {weeklySummaries.length > 0 ? (
            weeklySummaries.map((summary) => (
              <Link 
                key={summary.id}
                to={`/weekly-summary/${summary.id}`}
                className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Week {summary.weekNumber}
                    </span>
                    <span className="text-sm text-gray-500">
                      {summary.year}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 text-xl leading-tight mb-3">
                    {t('weekly_summary_title', { weekNumber: summary.weekNumber })}
                  </h3>
                  
                  <p className="text-gray-600 text-base mb-4">
                    {t('weekly_summary_description')}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-2" />
                      <span>Week {summary.weekNumber}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span>{summary.articles.length} artikelen</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm max-w-md mx-auto">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('no_summaries_available')}
                </h3>
                <p className="text-gray-600">
                  {t('summaries_generation_info')}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );

  if (isEmbedded) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#faf9f7' }}>
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#faf9f7' }}>
      {content}
      <BottomTabBar activeTab="overview" onTabChange={(tab) => {
        if (tab === 'news') {
          window.location.href = '/';
        } else if (tab === 'favorites') {
          window.location.href = '/?tab=favorites';
        } else if (tab === 'settings') {
          window.location.href = '/?tab=settings';
        }
      }} />
    </div>
  );
};

export default WeeklyOverview; 