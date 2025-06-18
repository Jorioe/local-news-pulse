import React from 'react';
import { useTranslation } from 'react-i18next';
import { NewsFilter } from '../types/news';

interface NewsFilterProps {
  activeFilter: NewsFilter;
  onFilterChange: (filter: NewsFilter) => void;
}

const NewsFilterComponent: React.FC<NewsFilterProps> = ({ activeFilter, onFilterChange }) => {
  const { t } = useTranslation();

  const filters: { value: NewsFilter; label: string }[] = [
    { value: 'alles', label: t('filter_all') },
    { value: 'lokaal', label: t('filter_local') },
    { value: 'regionaal', label: t('filter_regional') },
    { value: 'belangrijk', label: t('filter_important') },
  ];

  return (
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
  );
};

export default NewsFilterComponent;
