
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
    <div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100 overflow-x-auto">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeFilter === filter.value
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default NewsFilterComponent;
