
import React from 'react';
import { NewsFilter } from '../types/news';

interface NewsFilterProps {
  activeFilter: NewsFilter;
  onFilterChange: (filter: NewsFilter) => void;
}

const NewsFilterComponent: React.FC<NewsFilterProps> = ({ activeFilter, onFilterChange }) => {
  const filters: { value: NewsFilter; label: string }[] = [
    { value: 'alles', label: 'Alles' },
    { value: 'lokaal', label: 'Lokaal' },
    { value: 'regionaal', label: 'Regionaal' },
    { value: 'belangrijk', label: 'Belangrijk' },
  ];

  return (
    <div className="flex gap-3 px-6 py-4 overflow-x-auto">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeFilter === filter.value
              ? 'bg-orange-500 text-white shadow-lg'
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
