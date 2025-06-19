import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { NewsFilter } from '../types/news';

interface NewsFilterProps {
  activeFilter: NewsFilter;
  onFilterChange: (filter: NewsFilter) => void;
  showEvents?: boolean;
}

const NewsFilterComponent: React.FC<NewsFilterProps> = ({ activeFilter, onFilterChange, showEvents = false }) => {
  const { t } = useTranslation();

  const filters: { value: NewsFilter; label: string }[] = [
    { value: 'alles', label: t('filter_all') },
    { value: 'lokaal', label: t('filter_local') },
    { value: 'regionaal', label: t('filter_regional') },
    { value: 'belangrijk', label: t('filter_important') },
  ];

  return (
    <div className="space-y-2">
      <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 py-4 overflow-x-auto">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`whitespace-nowrap px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
              activeFilter === filter.value
                ? 'bg-foreground text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Events sub-filter */}
      {showEvents && (activeFilter === 'lokaal' || activeFilter === 'evenementen') && (
        <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 overflow-x-auto border-t border-gray-100 py-3">
          <button
            onClick={() => onFilterChange(activeFilter === 'evenementen' ? 'lokaal' : 'evenementen')}
            className={`whitespace-nowrap px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex-shrink-0 flex items-center gap-2 ${
              activeFilter === 'evenementen'
                ? 'bg-foreground text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {t('filter_events')}
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsFilterComponent;
