
import React from 'react';
import { Bell, MapPin, Globe, News } from 'lucide-react';
import { Language, Location } from '../types/news';

interface SettingsScreenProps {
  currentLocation: Location | null;
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  notificationsEnabled: boolean;
  onNotificationsToggle: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentLocation,
  currentLanguage,
  onLanguageChange,
  notificationsEnabled,
  onNotificationsToggle
}) => {
  const languages = [
    { code: 'nl' as Language, name: 'Nederlands', flag: '🇳🇱' },
    { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Instellingen</h1>
      
      <div className="space-y-6">
        {/* Location Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <MapPin className="text-orange-500 mr-3" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Locatie</h2>
          </div>
          
          <div className="text-gray-600">
            <p className="mb-2">Huidige locatie:</p>
            <p className="font-medium text-gray-900">
              {currentLocation 
                ? `${currentLocation.city}, ${currentLocation.region}, ${currentLocation.country}`
                : 'Geen locatie ingesteld'
              }
            </p>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <Globe className="text-orange-500 mr-3" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Taal</h2>
          </div>
          
          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  currentLanguage === lang.code
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <span className="text-xl mr-3">{lang.flag}</span>
                  <span className="font-medium text-gray-900">{lang.name}</span>
                </div>
                
                {currentLanguage === lang.code && (
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="text-orange-500 mr-3" size={24} />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Meldingen</h2>
                <p className="text-sm text-gray-600">Ontvang updates over lokaal nieuws</p>
              </div>
            </div>
            
            <button
              onClick={onNotificationsToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                notificationsEnabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <News className="text-orange-500 mr-3" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Over deze app</h2>
          </div>
          
          <div className="text-gray-600 space-y-2">
            <p>Versie: 1.0.0</p>
            <p>Lokaal nieuws, overal en altijd</p>
            <p className="text-sm">
              Deze app houdt u op de hoogte van het laatste nieuws in uw regio.
              Alle artikelen worden automatisch vertaald naar uw gekozen taal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
