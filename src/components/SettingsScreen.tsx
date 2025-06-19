import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, MapPin, Globe, Smartphone, Calendar } from 'lucide-react';
import { Language, Location } from '../types/news';
import useLanguageStore from '../store/languageStore';

interface SettingsScreenProps {
  currentLocation: Location;
  notificationsEnabled: boolean;
  eventsEnabled: boolean;
  onNotificationsToggle: () => void;
  onEventsToggle: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentLocation,
  notificationsEnabled,
  eventsEnabled,
  onNotificationsToggle,
  onEventsToggle
}) => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  const languages = [
    { code: 'nl' as Language, name: 'Nederlands' },
    { code: 'en' as Language, name: 'English' },
    { code: 'fr' as Language, name: 'Français' },
    { code: 'de' as Language, name: 'Deutsch' },
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
            <h2 className="text-xl font-bold text-accent">{t('location')}</h2>
          </div>
          
          <div className="text-gray-600">
            <p className="mb-2 font-medium">{t('current_location')}</p>
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
            <h2 className="text-xl font-bold text-accent">{t('language')}</h2>
          </div>
          
          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                  language === lang.code
                    ? 'border-foreground bg-orange-50'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <span className="text-sm font-bold w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full mr-3 text-gray-600">{lang.code.toUpperCase()}</span>
                  <span className="font-semibold text-accent">{lang.name}</span>
                </div>
                
                {language === lang.code && (
                  <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Events Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
                <Calendar className="text-foreground" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-accent">{t('events')}</h2>
                <p className="text-sm text-gray-600">{t('events_description')}</p>
              </div>
            </div>
            
            <button
              onClick={onEventsToggle}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                eventsEnabled ? 'bg-foreground' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                  eventsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
                <h2 className="text-xl font-bold text-accent">{t('notifications')}</h2>
                <p className="text-sm text-gray-600">{t('notifications_description')}</p>
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
            <h2 className="text-xl font-bold text-accent">{t('about_app')}</h2>
          </div>
          
          <div className="text-gray-600 space-y-3">
            <p className="font-semibold text-accent">{t('version')}</p>
            <p className="text-lg font-medium text-accent">{t('app_tagline')}</p>
            <p className="leading-relaxed">
              {t('app_description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
