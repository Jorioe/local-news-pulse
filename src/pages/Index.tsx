import React, { useState, useEffect } from 'react';
import { MapPin, Users } from 'lucide-react';
import BottomTabBar from '../components/BottomTabBar';
import LocationPicker from '../components/LocationPicker';
import NewsFilterComponent from '../components/NewsFilter';
import NewsCard from '../components/NewsCard';
import SettingsScreen from '../components/SettingsScreen';
import { useNews } from '../hooks/useNews';
import { Location, NewsFilter, Language, NewsArticle } from '../types/news';

const Index = () => {
  const [activeTab, setActiveTab] = useState('news');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [activeFilter, setActiveFilter] = useState<NewsFilter>('alles');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('nl');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { articles, loading, toggleFavorite } = useNews(currentLocation, activeFilter);

  useEffect(() => {
    // Set default location if none exists
    if (!currentLocation) {
      const savedLocation = localStorage.getItem('newsapp-location');
      if (savedLocation) {
        setCurrentLocation(JSON.parse(savedLocation));
      } else {
        // Set Amsterdam as default location
        const defaultLocation: Location = {
          city: 'Amsterdam',
          region: 'Noord-Holland',
          country: 'Nederland',
          nearbyCities: ['Amstelveen', 'Diemen', 'Zaandam'],
          lat: 52.3676,
          lon: 4.9041
        };
        setCurrentLocation(defaultLocation);
        localStorage.setItem('newsapp-location', JSON.stringify(defaultLocation));
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

  const renderNewsTab = () => (
    <div className="pb-20 min-h-screen" style={{ background: '#faf9f7' }}>
      <div className="text-white px-4 sm:px-6 pt-12 pb-8" style={{ background: '#ff5f2e' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-center">Lokaal Nieuws</h1>
          <p className="text-orange-100 text-base sm:text-lg text-center">Blijf op de hoogte, waar je ook bent</p>
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
        />
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Nieuws laden...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm max-w-md mx-auto">
              <Users className="mx-auto mb-4 text-gray-300" size={48} />
              <p className="text-lg font-medium mb-2">Geen artikelen gevonden</p>
              <p className="text-sm">Probeer een andere filter of locatie.</p>
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
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="pb-20 min-h-screen" style={{ background: '#faf9f7' }}>
      <div className="text-white px-4 sm:px-6 pt-12 pb-8" style={{ background: '#ff5f2e' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-center">Instellingen</h1>
          <p className="text-orange-100 text-base sm:text-lg text-center">Personaliseer jouw ervaring</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto">
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
