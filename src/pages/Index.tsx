import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { MapPin, Users, Loader2, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomTabBar from '../components/BottomTabBar';
import LocationPicker from '../components/LocationPicker';
import NewsFilterComponent from '../components/NewsFilter';
import NewsCard from '../components/NewsCard';
import EventsList from '../components/EventsList';
import SettingsScreen from '../components/SettingsScreen';
import WeeklyOverview from './WeeklyOverview';
import { useNews } from '../hooks/useNews';
import { Location, NewsFilter, Language, NewsArticle } from '../types/news';
import useLanguageStore from '../store/languageStore';

const getInitialLocation = (): Location => {
  try {
    const savedLocation = localStorage.getItem('newsapp-location');
    if (savedLocation) {
      return JSON.parse(savedLocation);
    }
  } catch (error) {
    console.error('Error reading location from localStorage:', error);
  }
  
  const defaultLocation: Location = {
    city: 'Amsterdam',
    region: 'Noord-Holland',
    country: 'Nederland',
    nearbyCities: ['Amstelveen', 'Diemen', 'Zaandam'],
    lat: 52.3676,
    lon: 4.9041
  };

  try {
    localStorage.setItem('newsapp-location', JSON.stringify(defaultLocation));
  } catch (error) {
    console.error('Error setting default location in localStorage:', error);
  }

  return defaultLocation;
};

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'news';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentLocation, setCurrentLocation] = useState<Location>(getInitialLocation);
  const [activeFilter, setActiveFilter] = useState<NewsFilter>('alles');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [eventsEnabled, setEventsEnabled] = useState(() => {
    const saved = localStorage.getItem('newsapp-events-enabled');
    return saved ? JSON.parse(saved) : false;
  });
  const { language, setLanguage } = useLanguageStore();

  const { 
    articles, 
    loading, 
    error, 
    toggleFavorite,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useNews(
    currentLocation, 
    // Only fetch news if we're not on the events filter
    activeFilter === 'evenementen' ? null : activeFilter
  );

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      console.log("Bottom in view, fetching next page...");
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    // Update URL when tab changes
    const newSearchParams = new URLSearchParams(searchParams);
    if (activeTab === 'news') {
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', activeTab);
    }
    window.history.replaceState(null, '', `${window.location.pathname}?${newSearchParams.toString()}`);
  }, [activeTab]);

  const handleLocationChange = (location: Location) => {
    setCurrentLocation(location);
    localStorage.setItem('newsapp-location', JSON.stringify(location));
  };

  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    localStorage.setItem('newsapp-notifications', JSON.stringify(!notificationsEnabled));
  };

  const handleEventsToggle = () => {
    const newValue = !eventsEnabled;
    setEventsEnabled(newValue);
    localStorage.setItem('newsapp-events-enabled', JSON.stringify(newValue));
    if (activeFilter === 'evenementen' && !newValue) {
      setActiveFilter('lokaal');
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'overview') {
      navigate('/weekly-overview');
    } else {
      setActiveTab(tab);
    }
  };

  const renderNewsTab = () => (
    <div className="pb-20 min-h-screen" style={{ background: '#faf9f7' }}>
      <div className="text-white px-4 sm:px-6 pt-12 pb-8" style={{ background: '#ff5f2e' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center">
            <img 
              src="/img/Loka-vierkant.png" 
              alt="Loka Logo" 
              className="h-12 mb-4 -mt-3 filter"
            />
            {/* <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-center">{t('local_news')}</h1> */}
            <p className="text-orange-100 text-base sm:text-lg text-center">{t('stay_informed')}</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4">
        <LocationPicker 
          currentLocation={currentLocation}
          onLocationChange={handleLocationChange}
        />
      </div>
      
      <div className="max-w-4xl mx-auto">
        <NewsFilterComponent 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          showEvents={eventsEnabled}
        />
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {activeFilter === 'evenementen' ? (
          <EventsList province={currentLocation.region} />
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">{t('loading_news')}</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm max-w-md mx-auto">
              <Users className="mx-auto mb-4 text-gray-300" size={48} />
              <p className="text-lg font-medium mb-2">{t('no_articles_found')}</p>
              <p className="text-sm">{t('try_another_filter')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {articles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Load More Trigger */}
        {activeFilter !== 'evenementen' && (
          <div ref={ref} className="mt-6 text-center">
            {isFetchingNextPage ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>{t('loading_more_articles')}</span>
              </div>
            ) : hasNextPage ? (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-2 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition"
              >
                {t('load_more')}
              </button>
            ) : (
              articles.length > 0 && <p className="text-gray-400">{t('all_news_loaded')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderFavoritesTab = () => {
    const favoriteArticles = articles.filter(article => article.isFavorite);

    return (
      <div className="pb-20 min-h-screen" style={{ background: '#faf9f7' }}>
        <div className="text-white px-4 sm:px-6 pt-12 pb-8" style={{ background: '#ff5f2e' }}>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-center">{t('Favorieten')}</h1>
            <p className="text-orange-100 text-base sm:text-lg text-center">{t('Hier vind je je opgeslagen artikelen')}</p>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {favoriteArticles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm max-w-md mx-auto">
                <Bookmark className="mx-auto mb-4 text-gray-300" size={48} />
                <p className="text-lg font-medium mb-2">{t('Geen favorieten gevonden')}</p>
                <p className="text-sm">{t('Sla een artikel op om deze hier weer te geven')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {favoriteArticles.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => (
    <div className="pb-20 min-h-screen" style={{ background: '#faf9f7' }}>
      <div className="text-white px-4 sm:px-6 pt-12 pb-8" style={{ background: '#ff5f2e' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-center">{t('settings')}</h1>
          <p className="text-orange-100 text-base sm:text-lg text-center">{t('personalize_experience')}</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <SettingsScreen
          currentLocation={currentLocation}
          notificationsEnabled={notificationsEnabled}
          eventsEnabled={eventsEnabled}
          onNotificationsToggle={handleNotificationsToggle}
          onEventsToggle={handleEventsToggle}
        />
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <WeeklyOverview isEmbedded={true} />
  );

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      {error ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('error_occurred')}</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-orange-600 hover:bg-orange-700"
            >
              {t('try_again')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'news' && renderNewsTab()}
          {activeTab === 'favorites' && renderFavoritesTab()}
          {activeTab === 'settings' && renderSettingsTab()}
          {activeTab === 'overview' && renderOverviewTab()}
          <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
};

export default Index;
