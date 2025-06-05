
import React from 'react';
import { Bookmark, BookmarkMinus, MapPin } from 'lucide-react';
import { NewsArticle } from '../types/news';

interface NewsCardProps {
  article: NewsArticle;
  onToggleFavorite: (articleId: string) => void;
  onClick: (article: NewsArticle) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onToggleFavorite, onClick }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Net gepubliceerd';
    if (diffInHours < 24) return `${diffInHours}u geleden`;
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={() => onClick(article)}
    >
      <div className="aspect-[16/10] sm:aspect-video bg-gray-200 relative overflow-hidden">
        <img 
          src={article.thumbnail} 
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(article.id);
            }}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all duration-200"
          >
            {article.isFavorite ? (
              <BookmarkMinus className="text-orange-500" size={14} />
            ) : (
              <Bookmark className="text-gray-600" size={14} />
            )}
          </button>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        <h3 className="font-bold text-gray-900 text-lg sm:text-xl leading-snug mb-2 sm:mb-3 line-clamp-2">
          {article.title}
        </h3>
        
        <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
          {article.summary}
        </p>
        
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
          <div className="flex items-center">
            <MapPin size={12} className="mr-1.5" />
            <span className="truncate">{article.location}</span>
          </div>
          
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0 ml-2">
            <span>{formatTime(article.publishedAt)}</span>
            <span>•</span>
            <span className="font-medium truncate max-w-20 sm:max-w-none">{article.source}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
          <span className="text-xs sm:text-sm text-gray-500 truncate">
            Door {article.author}
          </span>
          
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
            article.category === 'belangrijk' 
              ? 'bg-red-100 text-red-700'
              : article.category === 'regionaal'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
