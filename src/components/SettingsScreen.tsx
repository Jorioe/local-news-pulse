import React from 'react';
import { Bell, MapPin, Globe, Smartphone } from 'lucide-react';
import { Language, Location } from '../types/news';

interface SettingsScreenProps {
  currentLocation: Location;
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
    <div className="px-6 py-6 pb-20">
      <div className="space-y-6">
        {/* Location Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-0">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
              <MapPin className="text-foreground" size={20} />
            </div>
            <h2 className="text-xl font-bold text-accent">Locatie</h2>
          </div>
          
          <div className="text-gray-600">
            <p className="mb-2 font-medium">Huidige locatie:</p>
            <p className="text-accent text-lg">
              {`${currentLocation.city}, ${currentLocation.region}, ${currentLocation.country}`}
            </p>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-0">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
              <Globe className="text-foreground" size={20} />
            </div>
            <h2 className="text-xl font-bold text-accent">Taal</h2>
          </div>
          
          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                  currentLanguage === lang.code
                    ? 'border-foreground bg-orange-50'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-4">{lang.flag}</span>
                  <span className="font-semibold text-accent">{lang.name}</span>
                </div>
                
                {currentLanguage === lang.code && (
                  <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
                <Bell className="text-foreground" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-accent">Meldingen</h2>
                <p className="text-sm text-gray-600">Ontvang updates over lokaal nieuws</p>
              </div>
            </div>
            
            <button
              onClick={onNotificationsToggle}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                notificationsEnabled ? 'bg-foreground' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-0">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
              <Smartphone className="text-foreground" size={20} />
            </div>
            <h2 className="text-xl font-bold text-accent">Over deze app</h2>
          </div>
          
          <div className="text-gray-600 space-y-3">
            <p className="font-semibold text-accent">Versie: 1.0.0</p>
            <p className="text-lg font-medium text-accent">Lokaal nieuws, overal en altijd</p>
            <p className="leading-relaxed">
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
