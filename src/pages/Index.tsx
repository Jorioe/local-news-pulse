
import React, { useState, useEffect } from 'react';
import { MapPin, Users } from 'lucide-react';
import BottomTabBar from '../components/BottomTabBar';
import LocationPicker from '../components/LocationPicker';
import NewsFilterComponent from '../components/NewsFilter';
import NewsCard from '../components/NewsCard';
import ArticleDetail from '../components/ArticleDetail';
import SettingsScreen from '../components/SettingsScreen';
import LandingSection from '../components/LandingSection';
import { useNews } from '../hooks/useNews';
import { Location, NewsFilter, Language, NewsArticle } from '../types/news';

const Index = () => {
  const [activeTab, setActiveTab] = useState('news');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [activeFilter, setActiveFilter] = useState<NewsFilter>('alles');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('nl');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  const { articles, loading, toggleFavorite } = useNews(currentLocation, activeFilter);

  useEffect(() => {
    // Try to detect location on app load
    if (!currentLocation) {
      const savedLocation = localStorage.getItem('newsapp-location');
      if (savedLocation) {
        setCurrentLocation(JSON.parse(savedLocation));
        setShowLanding(false);
      }
    }
  }, [currentLocation]);

  const handleLocationChange = (location: Location) => {
    setCurrentLocation(location);
    localStorage.setItem('newsapp-location', JSON.stringify(location));
    setShowLanding(false);
  };

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('newsapp-language', language);
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    localStorage.setItem('newsapp-notifications', JSON.stringify(!notificationsEnabled));
  };

  const handleStartApp = () => {
    setShowLanding(false);
  };

  if (selectedArticle) {
    return (
      <ArticleDetail 
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
        onToggleFavorite={toggleFavorite}
      />
    );
  }

  if (showLanding) {
    return (
      <LandingSection 
        onStart={handleStartApp}
        onLocationChange={handleLocationChange}
      />
    );
  }

  const renderNewsTab = () => (
    <div className="pb-20 min-h-screen" style={{ background: '#faf9f7' }}>
      <div className="gradient-orange text-white px-4 sm:px-6 pt-12 pb-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">Lokaal Nieuws</h1>
          <p className="text-orange-100 text-base sm:text-lg">Blijf op de hoogte, waar je ook bent</p>
        </div>
      </div>
      
      <div className="max-w-md mx-auto px-4 sm:px-6 -mt-4">
        <LocationPicker 
          currentLocation={currentLocation}
          onLocationChange={handleLocationChange}
        />
      </div>
      
      <NewsFilterComponent 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 space-y-4 sm:space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Nieuws laden...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
              <Users className="mx-auto mb-4 text-gray-300" size={48} />
              <p className="text-lg font-medium mb-2">Geen artikelen gevonden</p>
              <p className="text-sm">Probeer een andere filter of locatie.</p>
            </div>
          </div>
        ) : (
          articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onToggleFavorite={toggleFavorite}
              onClick={setSelectedArticle}
            />
          ))
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="pb-20 min-h-screen" style={{ background: '#faf9f7' }}>
      <div className="gradient-orange text-white px-4 sm:px-6 pt-12 pb-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">Instellingen</h1>
          <p className="text-orange-100 text-base sm:text-lg">Personaliseer jouw ervaring</p>
        </div>
      </div>
      
      <div className="max-w-md mx-auto">
        <SettingsScreen
          currentLocation={currentLocation}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          notificationsEnabled={notificationsEnabled}
          onNotificationsToggle={handleNotificationsToggle}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      {activeTab === 'news' && renderNewsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
      
      <BottomTabBar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default Index;
