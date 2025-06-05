
import React from 'react';
import { Newspaper, Settings } from 'lucide-react';

interface BottomTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'news', label: 'Nieuws', icon: Newspaper },
    { id: 'settings', label: 'Instellingen', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 safe-area-pb z-50">
      <div className="max-w-md mx-auto flex justify-around items-center px-6 py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-3 px-6 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                isActive 
                  ? 'text-foreground' 
                  : 'text-muted hover:text-gray-700'
              }`}
            >
              <Icon size={24} className="mb-1.5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTabBar;
