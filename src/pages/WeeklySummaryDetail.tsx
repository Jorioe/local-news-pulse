import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Image as ImageIcon } from 'lucide-react';
import { NewsArticle } from '../types/news';
import { useTranslation } from 'react-i18next';
import BottomTabBar from '../components/BottomTabBar';

interface WeeklySummary {
  id: string;
  weekNumber: number;
  year: number;
  articles: NewsArticle[];
}

// Mock data for weekly summaries (in a real app, this would come from an API)
const mockWeeklySummaries: WeeklySummary[] = [
  {
    id: 'week-52-2023',
    weekNumber: 52,
    year: 2023,
    articles: [
      {
        id: '1',
        title: 'Lokaal restaurant wint prestigieuze prijs',
        summary: 'Het restaurant De Gouden Lepel heeft de nationale horecaprijs gewonnen.',
        content: '<p>Het lokale restaurant De Gouden Lepel heeft gisteren de prestigieuze nationale horecaprijs in ontvangst mogen nemen. De jury prees vooral de innovatieve gerechten en de uitstekende service.</p><p>Chef-kok Marie van Dijk toonde zich zeer verheugd met de prijs: "Dit is een erkenning voor het harde werk van ons hele team. We blijven streven naar culinaire excellentie met lokale ingrediënten."</p><p>Het restaurant staat bekend om zijn seizoensgebonden menu en nauwe samenwerking met lokale boeren.</p>',
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
        content: '<p>Het nieuwe cultuurcentrum De Kunsthaven heeft vandaag officieel zijn deuren geopend. Het moderne gebouw biedt ruimte aan diverse kunstvormen en culturele activiteiten.</p><p>Het centrum beschikt over een theaterzaal, expositieruimtes en workshopruimtes. "We willen een bruisende plek zijn waar kunst en cultuur samenkomen," aldus directeur Anna Bakker.</p><p>De eerste tentoonstelling, met werk van lokale kunstenaars, is vanaf morgen te bezichtigen.</p>',
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
        content: '<p>Het Amsterdamse basketbalteam De Vliegende Leeuwen heeft zich gisteravond geplaatst voor de finale van de nationale competitie. In een spannende wedstrijd werd de halve finale gewonnen met 78-76.</p><p>Coach Tim de Vries: "Dit is een historisch moment voor ons team. De spelers hebben alles gegeven en verdienen deze finaleplaats."</p><p>De finale wordt volgende week zaterdag gespeeld in de Sporthallen Zuid.</p>',
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
  }
];

const WeeklySummaryDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Find the summary in our mock data
  const summary = mockWeeklySummaries.find(s => s.id === id);

  const handleTabChange = (tab: string) => {
    if (tab === 'news') {
      navigate('/');
    } else if (tab === 'favorites') {
      navigate('/?tab=favorites');
    } else if (tab === 'settings') {
      navigate('/?tab=settings');
    } else if (tab === 'overview') {
      navigate('/?tab=overview');
    }
  };

  const handleBackClick = () => {
    navigate('/?tab=overview');
  };

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('summary_not_found')}</h1>
        <p className="text-gray-600 mb-6">{t('summary_load_error')}</p>
        <button 
          onClick={handleBackClick}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors inline-flex items-center"
        >
          <ArrowLeft className="mr-2" size={16} />
          {t('back_to_overview')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#faf9f7' }}>
      {/* Header */}
      <div className="text-white px-4 sm:px-6 pt-12 pb-8" style={{ background: '#ff5f2e' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <button 
              onClick={handleBackClick}
              className="p-2 -ml-2 rounded-full hover:bg-orange-500 transition-colors"
            >
              <ArrowLeft className="text-white" size={24} />
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            {t('weekly_summary_title', { weekNumber: summary.weekNumber })}
          </h1>
          <div className="flex items-center gap-4 text-orange-100">
            <div className="flex items-center">
              <Calendar size={16} className="mr-1" />
              <span>Week {summary.weekNumber}, {summary.year}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Articles */}
        <div className="space-y-6">
          {summary.articles.map((article, index) => (
            <div key={article.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <span className="bg-orange-100 text-orange-700 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">
                      {article.title}
                    </h2>

                    {article.thumbnail && (
                      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6">
                        <img 
                          src={article.thumbnail} 
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/news-placeholder.svg';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{article.source}</span>
                    </div>

                    <div className="prose prose-lg max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: article.content }} />
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Link 
                        to={`/article/${article.id}`}
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
                      >
                        {t('read_full_article')} →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomTabBar activeTab="overview" onTabChange={handleTabChange} />
    </div>
  );
};

export default WeeklySummaryDetail; 