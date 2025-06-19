import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Filter } from 'lucide-react';
import { NewsFilter, ContentCategory } from '../types/news';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface NewsFilterProps {
  activeFilter: NewsFilter;
  activeContentCategory?: ContentCategory;
  onFilterChange: (filter: NewsFilter) => void;
  onContentCategoryChange?: (category: ContentCategory | undefined) => void;
  showEvents?: boolean;
}

const NewsFilterComponent: React.FC<NewsFilterProps> = ({ 
  activeFilter, 
  activeContentCategory,
  onFilterChange, 
  showEvents = false 
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | undefined>(undefined);

  const filters: { value: NewsFilter; label: string }[] = [
    { value: 'alles', label: t('filter_all') },
    { value: 'lokaal', label: t('filter_local') },
    { value: 'regionaal', label: t('filter_regional') },
    { value: 'belangrijk', label: t('filter_important') },
  ];

  const contentCategories: { value: ContentCategory; label: string }[] = [
    { value: 'politiek', label: t('category_politics') },
    { value: 'cultuur', label: t('category_culture') },
    { value: 'economie', label: t('category_economy') },
    { value: 'sport', label: t('category_sports') },
    { value: 'onderwijs', label: t('category_education') }
  ];

  const handleCategorySelect = (category: ContentCategory | undefined) => {
    setSelectedCategory(category);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 sm:gap-3 px-2 sm:px-6 py-4 overflow-x-auto items-center">
        <div className="flex-1 flex gap-2 sm:gap-3 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={`whitespace-nowrap px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
                activeFilter === filter.value
                  ? 'bg-foreground text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-xl flex-shrink-0 ml-2 ${
                selectedCategory ? 'bg-foreground text-white hover:bg-foreground/90' : 'hover:bg-gray-100'
              }`}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                className={`justify-start font-medium ${
                  !selectedCategory 
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleCategorySelect(undefined)}
              >
                {t('filter_all_categories')}
              </Button>
              {contentCategories.map((category) => (
                <Button
                  key={category.value}
                  variant="ghost"
                  className={`justify-start font-medium ${
                    selectedCategory === category.value 
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleCategorySelect(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Events sub-filter */}
      {showEvents && (activeFilter === 'lokaal' || activeFilter === 'evenementen') && (
        <div className="flex gap-2 sm:gap-3 px-2 sm:px-6 overflow-x-auto border-t border-gray-100 py-3">
          <button
            onClick={() => onFilterChange(activeFilter === 'evenementen' ? 'lokaal' : 'evenementen')}
            className={`whitespace-nowrap px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex-shrink-0 flex items-center gap-2 ${
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
