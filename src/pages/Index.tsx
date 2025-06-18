import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import BottomTabBar from '../components/BottomTabBar';
import LocationPicker from '../components/LocationPicker';
import NewsFilterComponent from '../components/NewsFilter';
import NewsCard from '../components/NewsCard';
import ArticleDetail from '../components/ArticleDetail';
import SettingsScreen from '../components/SettingsScreen';
import { useNews } from '../hooks/useNews';
import { Location, NewsFilter, Language, NewsArticle } from '../types/news';

const Index = () => {
  const [activeTab, setActiveTab] = useState('news');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [activeFilter, setActiveFilter] = useState<NewsFilter>('alles');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('nl');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { articles, favoriteArticles, loading, toggleFavorite } = useNews(currentLocation, activeFilter);

  useEffect(() => {
    // Try to detect location on app load
    if (!currentLocation) {
      const savedLocation = localStorage.getItem('newsapp-location');
      if (savedLocation) {
        setCurrentLocation(JSON.parse(savedLocation));
      }
    }
  }, [currentLocation]);

  const handleLocationChange = (location: Location) => {
    setCurrentLocation(location);
    localStorage.setItem('newsapp-location', JSON.stringify(location));
  };

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('newsapp-language', language);
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    localStorage.setItem('newsapp-notifications', JSON.stringify(!notificationsEnabled));
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

  const renderNewsTab = () => (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Lokaal Nieuws</h1>
        <p className="text-orange-100">Blijf op de hoogte, waar je ook bent</p>
      </div>
      
      <div className="p-4">
        <LocationPicker 
          currentLocation={currentLocation}
          onLocationChange={handleLocationChange}
        />
      </div>
      
      <NewsFilterComponent 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse">Nieuws laden...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Geen artikelen gevonden voor deze filter.
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

  const renderFavoritesTab = () => (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Favorieten</h1>
        <p className="text-orange-100">Jouw opgeslagen artikelen</p>
      </div>
      
      <div className="p-4 space-y-4">
        {favoriteArticles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <Bookmark className="mx-auto text-gray-300" size={48} />
            </div>
            <p>Nog geen favorieten opgeslagen.</p>
            <p className="text-sm mt-2">Tik op het bladwijzer-icoon bij artikelen om ze op te slaan.</p>
          </div>
        ) : (
          favoriteArticles.map((article) => (
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
    <div className="pb-20">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Instellingen</h1>
        <p className="text-orange-100">Personaliseer jouw nieuws ervaring</p>
      </div>
      
      <SettingsScreen
        currentLocation={currentLocation}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        notificationsEnabled={notificationsEnabled}
        onNotificationsToggle={handleNotificationsToggle}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {activeTab === 'news' && renderNewsTab()}
      {activeTab === 'favorites' && renderFavoritesTab()}
      {activeTab === 'settings' && renderSettingsTab()}
      
      <BottomTabBar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default Index;
